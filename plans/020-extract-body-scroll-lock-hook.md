# Plan 020: Extract a shared, reference-counted body-scroll-lock hook

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 240e4f8..HEAD -- components/layout/Header.tsx components/ui/Lightbox.tsx`
> If either in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `240e4f8`, 2026-08-07

## Why this matters

Two components independently lock `document.body.style.overflow` while
they're open: the mobile nav drawer in `Header.tsx` and the image lightbox
in `Lightbox.tsx`. Each sets and clears the same global style property with
its own, unrelated `useLayoutEffect`/`useEffect`. Because both write to the
same global (`document.body.style.overflow`), if a user opens the mobile
drawer and then, without closing it, triggers the lightbox to open (or vice
versa — e.g. tapping a gallery card visible behind a transparent part of the
drawer, or a fast double-interaction), whichever component closes/unmounts
*first* runs its cleanup and sets `overflow = ""`, silently unlocking scroll
even though the other component is still open and still expects it locked.
This is a real, if narrow, interaction bug class — two independent "lock"
effects with no shared reference count will always have this failure mode.
Extracting one `useBodyScrollLock` hook with a module-level lock counter
fixes it structurally: scroll only unlocks when the *last* lock is released,
regardless of which component locked first or unlocked first.

## Current state

- `components/layout/Header.tsx:134-161` — the drawer's lock effect (locks
  scroll AND marks `main`/`footer` `inert` while the drawer is open):

```tsx
useLayoutEffect(() => {
  document.body.style.overflow = open ? "hidden" : "";

  // Make main content and footer inert while the drawer is open so screen
  // readers in browse/virtual mode can't reach off-screen content.
  const siblings: HTMLElement[] = Array.from(
    document.querySelectorAll<HTMLElement>("main, footer"),
  );
  siblings.forEach((el) => {
    if (open) {
      el.setAttribute("inert", "");
    } else {
      el.removeAttribute("inert");
    }
  });

  return () => {
    document.body.style.overflow = "";
    siblings.forEach((el) => el.removeAttribute("inert"));
  };
}, [open]);
```

  This effect does two unrelated things: (a) lock/unlock scroll, (b)
  toggle `inert` on page siblings for the a11y reason explained in the
  comment above it (`components/layout/Header.tsx:134-140` in the full
  file). Only (a) is duplicated with `Lightbox.tsx`; (b) is drawer-specific
  and stays in `Header.tsx`.

- `components/ui/Lightbox.tsx:66-71` — the lightbox's lock effect, simpler
  (mounts already imply "open", so there's no `open` boolean — the effect
  runs once on mount and cleans up on unmount):

```tsx
useEffect(() => {
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = "";
  };
}, []);
```

- Existing hooks convention: `lib/hooks/useTheme.ts` is the one hook already
  in the repo (named export from `lib/hooks/<name>.ts`). Match that
  location and style.
- `Header.tsx`'s effect intentionally uses `useLayoutEffect`, not
  `useEffect` — the comment at `components/layout/Header.tsx:137-140`
  explains why (cleanup must run synchronously before paint, to avoid a
  frame where `main` is `inert` but a new page is already visible after a
  navigation triggered while the drawer was open). The shared hook should
  use `useLayoutEffect` too, for the same reason — this is a small,
  intentional behavior tightening for `Lightbox.tsx` (which currently uses
  plain `useEffect`), not a regression; call it out in the commit message.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|-------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Lint      | `pnpm lint`              | exit 0              |
| Build     | `pnpm build`             | exit 0              |

## Scope

**In scope**:
- `lib/hooks/useBodyScrollLock.ts` (new file)
- `components/layout/Header.tsx`
- `components/ui/Lightbox.tsx`

**Out of scope** (do NOT touch, even though they look related):
- The `inert`-toggling logic in `Header.tsx` — stays in `Header.tsx`, not
  part of the shared hook (it's drawer-specific, not a general scroll-lock
  concern).
- Any other effect in either file (focus trap, Escape-key handling,
  keyboard navigation, logo hover animation, etc.) — untouched.

## Git workflow

- Branch: `advisor/020-extract-body-scroll-lock-hook`
- Commit per step; conventional-commit style matching `git log` (e.g.
  `refactor: extract duplicated texture overlays into shared utilities`,
  commit `90e92bc`, is the closest precedent for this exact kind of
  extraction).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `lib/hooks/useBodyScrollLock.ts`

```ts
"use client";

import { useLayoutEffect } from "react";

// Module-level count, shared across every component using this hook, so
// two independent lockers (e.g. the mobile nav drawer and the lightbox)
// don't unlock scroll out from under each other — scroll only unlocks when
// the last active lock releases.
let lockCount = 0;

export function useBodyScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return;

    lockCount++;
    if (lockCount === 1) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [locked]);
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Wire `Header.tsx` to the hook

Split the existing effect (shown in "Current state") into a call to the new
hook plus a second, `inert`-only effect. Replace the block at
`components/layout/Header.tsx:134-161` with:

```tsx
useBodyScrollLock(open);

// Make main content and footer inert while the drawer is open so screen
// readers in browse/virtual mode can't reach off-screen content.
useLayoutEffect(() => {
  const siblings: HTMLElement[] = Array.from(
    document.querySelectorAll<HTMLElement>("main, footer"),
  );
  siblings.forEach((el) => {
    if (open) {
      el.setAttribute("inert", "");
    } else {
      el.removeAttribute("inert");
    }
  });

  return () => {
    siblings.forEach((el) => el.removeAttribute("inert"));
  };
}, [open]);
```

Add the import: `import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";`.
Keep the existing `useLayoutEffect` import from `"react"` — it's still used
by the `inert` effect above.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Wire `Lightbox.tsx` to the hook

Replace the block at `components/ui/Lightbox.tsx:66-71` with:

```tsx
useBodyScrollLock(true);
```

Add the import: `import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";`.
`Lightbox` only ever mounts while "open" (there's no boolean prop — its
presence in the tree via the `activeItem && createPortal(...)` pattern in
`GalleryGrid.tsx`/`FeaturedWorkGrid.tsx` is what represents "open"), so
`true` is the correct constant argument — matches the original
`useEffect(() => {...}, [])`'s always-lock-while-mounted behavior. If
`useEffect` was the only hook imported from `"react"` for this purpose,
check whether it's still needed elsewhere in the file (`grep -n "useEffect"
components/ui/Lightbox.tsx` — the file also has a keydown-listener effect
and an `isVisible` mount-timer effect, both unrelated and unchanged, so
`useEffect` stays imported).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm build
```

**Verify**: all three exit 0.

## Test plan

No automated tests exist for either component. Manual verification, since
this plan's whole purpose is fixing an interaction-ordering bug:

1. Run `pnpm dev` at a mobile viewport width (drawer only renders `lg:hidden`).
2. Open `/portfolio`. Open the mobile nav drawer (hamburger button) —
   confirm the page no longer scrolls.
3. Close the drawer — confirm the page scrolls again.
4. Open a gallery item's lightbox (without the drawer open) — confirm the
   page no longer scrolls; close it — confirm scroll returns.
5. **The regression case this plan fixes**: open the mobile nav drawer,
   then (without closing it) trigger a lightbox open if reachable in that
   state, or — simpler and equally valid — open the drawer, then in a
   second browser tab/window confirm the fix conceptually by reading
   `lockCount` behavior in the new hook (it's a module-level counter, so a
   unit test isn't practical without a DOM testing setup this repo doesn't
   have). At minimum, confirm steps 2-4 individually still work correctly
   after the refactor — that alone proves no regression, even though the
   overlapping-lock scenario is hard to trigger manually in this specific
   UI (the drawer and lightbox aren't reachable simultaneously through
   normal navigation today). The fix's value is defensive/structural for
   future UI states where they might overlap, not a currently-reachable bug.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm build` exits 0
- [ ] `lib/hooks/useBodyScrollLock.ts` exists and is imported by both `components/layout/Header.tsx` and `components/ui/Lightbox.tsx` (`grep -l "useBodyScrollLock" components/layout/Header.tsx components/ui/Lightbox.tsx` returns both files)
- [ ] `grep -n "document.body.style.overflow" components/layout/Header.tsx components/ui/Lightbox.tsx` returns no matches (both now delegate to the hook)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code in either file no longer matches the "Current state" excerpts.
- Manual verification (steps 2-4 in "Test plan") shows scroll doesn't lock,
  doesn't unlock, or the drawer's `inert` behavior changed — the split in
  Step 2 must preserve the exact same `inert` timing as before.
- You find a way to reach the drawer-open + lightbox-open state
  simultaneously in the current UI and it does NOT behave correctly after
  this change (scroll should stay locked until both close) — that would
  mean the reference-counting hook has a bug, not that the scenario should
  be dismissed.

## Maintenance notes

- Any future component that needs to lock body scroll while open (a modal,
  a command palette, etc.) should use `useBodyScrollLock` rather than
  writing a third copy of this pattern.
- The module-level `lockCount` in the hook is intentionally shared across
  all instances/components — do not refactor it into per-instance state
  (e.g. a React context) without preserving the "only unlock when the last
  lock releases" guarantee, since that's the entire point of this plan.
- A reviewer should scrutinize: that `Header.tsx`'s `inert` effect still
  runs with the exact same timing relative to the scroll lock as before
  (both were previously in one `useLayoutEffect`; they're now two separate
  ones with the same `[open]` dependency, which React guarantees run in
  the order they're declared — `useBodyScrollLock(open)` before the `inert`
  effect — so ordering is preserved, but worth a second look in review).
