# Plan 038: Fix lightbox focus not returning to its trigger after close

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0dc6441..HEAD -- components/ui/Lightbox.tsx lib/hooks/useLightboxGallery.ts`
> If either file changed since this plan was written, compare the "Current
> state" excerpts below against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug (accessibility)
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

Plan 037's pre-launch verification pass (2026-09-27) found and reproduced a
real, user-facing bug: closing the portfolio lightbox — whether via the
Escape key or the visible "Close lightbox" button — leaves keyboard focus
on `<body>` instead of returning it to the gallery thumbnail that opened
it. Reproduced twice, both close paths. For a keyboard or screen-reader
user, this means the next Tab press after closing an image starts over
from the top of the document instead of continuing from the gallery item
they were just looking at — a real loss of place, not a cosmetic issue.

**Root cause, confirmed by reading the code directly** (this plan's author
independently verified plan 037's hypothesis against the live files, not
just taken on its word):

`components/ui/Lightbox.tsx`'s `handleClose` calls `onRestoreFocus()`
**immediately**, then only calls `dialogRef.current?.close()` 200ms later
(after the fade-out animation finishes):

```tsx
const handleClose = useCallback(() => {
  onRestoreFocus();
  setIsVisible(false);
  setTimeout(() => {
    dialogRef.current?.close();
    onClose();
  }, 200);
}, [onClose, onRestoreFocus]);
```

`onRestoreFocus` resolves to `useLightboxGallery.ts`'s `restoreFocus`:

```ts
const restoreFocus = useCallback(
  () => triggerRefs.current[activeIndex ?? 0]?.focus(),
  [activeIndex],
);
```

At the moment `onRestoreFocus()` runs, the native `<dialog>` element is
still open via `.showModal()` (called in this component's own mount
effect, `Lightbox.tsx:43-47`). A `<dialog>` opened with `showModal()`
enforces the browser's built-in modal focus scope: focus cannot move to an
element outside the still-open dialog. So the `.focus()` call on the
gallery thumbnail is silently blocked, and focus falls back to `<body>`.
By the time `dialog.close()` actually runs 200ms later, focus is no
longer inside the dialog (it's already on `<body>`), so the native
`<dialog>.close()` behavior that *would* restore focus to the
previously-focused element — but only if focus is still inside the dialog
at close time — doesn't fire either. Both the manual restore and the
browser's own automatic restore miss, for the same underlying reason: the
call order puts the restore attempt before the dialog actually closes.

The fix is a one-line reorder: call `onRestoreFocus()` *after*
`dialogRef.current.close()`, inside the same `setTimeout` callback that
already exists for the fade-out delay — not before it.

## Current state

`components/ui/Lightbox.tsx` (relevant excerpt, lines 43–56, verified by
direct read):

```tsx
  useEffect(() => {
    dialogRef.current?.showModal();
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    onRestoreFocus();
    setIsVisible(false);
    setTimeout(() => {
      dialogRef.current?.close();
      onClose();
    }, 200);
  }, [onClose, onRestoreFocus]);
```

`lib/hooks/useLightboxGallery.ts` (full file, verified by direct read —
**no changes needed here**, included only so the executor can confirm
`onRestoreFocus`'s actual behavior without guessing):

```ts
"use client";

import { useCallback, useRef, useState } from "react";
import type { GalleryItem } from "@/components/ui/GalleryGrid";

export function useLightboxGallery(items: GalleryItem[]) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  const open = useCallback((index: number) => setActiveIndex(index), []);
  const close = useCallback(() => setActiveIndex(null), []);
  const restoreFocus = useCallback(
    () => triggerRefs.current[activeIndex ?? 0]?.focus(),
    [activeIndex],
  );
  const prev = useCallback(
    () => setActiveIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
    [],
  );
  const next = useCallback(
    () =>
      setActiveIndex((i) => (i !== null && i < items.length - 1 ? i + 1 : i)),
    [items.length],
  );

  const setTriggerRef = useCallback(
    (index: number) => (el: HTMLButtonElement | null) => {
      triggerRefs.current[index] = el;
    },
    [],
  );

  return { activeItem, open, close, prev, next, restoreFocus, setTriggerRef };
}
```

Note: `restoreFocus` reads `activeIndex` at the time it's *called*, not at
the time `handleClose` was defined — but `close()` (called via `onClose()`
inside the same `setTimeout`) sets `activeIndex` to `null` via
`setActiveIndex(null)`. If the reorder in Step 1 below calls
`onRestoreFocus()` *after* `onClose()` runs, `activeIndex` would already
be `null` by then, and `restoreFocus` would fall back to
`triggerRefs.current[0]` (the wrong thumbnail) instead of the one that was
actually open. **The two calls inside the `setTimeout` must be reordered
relative to each other carefully — see Step 1's exact ordering.**

`components/ui/Lightbox.tsx:102-107` (the close button, for context — not
modified by this plan):

```tsx
      <button
        autoFocus
        onClick={handleClose}
        aria-label="Close lightbox"
        className="absolute top-8 right-8 z-10 w-14 h-14 rounded-full bg-ink-2 border border-paper/10 text-paper flex items-center justify-center hover:bg-gold hover:text-ink hover:border-gold transition-colors focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
      >
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0, no errors   |
| Tests     | `pnpm test`               | all pass, same count as before this plan |
| Lint      | `pnpm lint`               | exit 0               |
| Build     | `pnpm build`              | exit 0               |
| Dev server (manual check) | `pnpm dev` | serves on `http://localhost:3000` |

## Scope

**In scope** (the only file you should modify):
- `components/ui/Lightbox.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `lib/hooks/useLightboxGallery.ts` — `restoreFocus`'s implementation is
  correct as-is; the bug is purely in `Lightbox.tsx`'s call order, not in
  this hook. Do not add a "remember the index at close time" parameter or
  otherwise change this file's signature — see Step 1 for how the reorder
  avoids that need entirely.
- The `showModal()` call in the mount `useEffect` (lines 43-47) — unrelated
  to the close path.
- The Escape-key handler and Arrow-key prev/next handlers
  (`Lightbox.tsx:58-76`) — they already call `handleClose()` /
  `onPrev()` / `onNext()` correctly; nothing there needs to change since
  the fix lives entirely inside `handleClose` itself.
- The visible "Close lightbox" button (lines 102-107) — its `onClick={handleClose}`
  wiring is correct and doesn't need to change.

## Git workflow

- Branch: none required, or `advisor/038-lightbox-focus-restore` — LOW
  risk, single-file, few-line change.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `fix: restore focus to gallery thumbnail after lightbox close`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Reorder `handleClose` so focus restores after the dialog actually closes

Replace:

```tsx
  const handleClose = useCallback(() => {
    onRestoreFocus();
    setIsVisible(false);
    setTimeout(() => {
      dialogRef.current?.close();
      onClose();
    }, 200);
  }, [onClose, onRestoreFocus]);
```

with:

```tsx
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      dialogRef.current?.close();
      onRestoreFocus();
      onClose();
    }, 200);
  }, [onClose, onRestoreFocus]);
```

This does two things at once, both required:
1. Moves `onRestoreFocus()` from *before* the 200ms delay to *inside* the
   `setTimeout`, after `dialogRef.current.close()` — so focus moves to the
   thumbnail only once the native dialog is actually closed and no longer
   enforcing its modal focus scope.
2. Calls `onRestoreFocus()` **before** `onClose()`, not after — this
   matters because of the `activeIndex` timing issue noted in "Current
   state": `onClose()` is what ultimately triggers `setActiveIndex(null)`
   upstream (via `useLightboxGallery`'s `close()`), and once `activeIndex`
   is `null`, `restoreFocus` would fall back to `triggerRefs.current[0]`
   instead of the thumbnail that was actually open. Calling
   `onRestoreFocus()` first, while `activeIndex` still holds the correct
   value, avoids that entirely — no change to `useLightboxGallery.ts` is
   needed.

**Verify**: `grep -n "onRestoreFocus" components/ui/Lightbox.tsx` shows
`onRestoreFocus()` appearing *after* `dialogRef.current?.close();` and
*before* `onClose();` in the `setTimeout` callback (three lines in that
order).

### Step 2: Full verification sweep

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.

**Verify**: all four exit 0, `pnpm test` reports the same pass count as a
pre-change baseline (this plan doesn't add or remove tests in this step —
see "Test plan" below for the one addition).

### Step 3: Manual browser confirmation

Run `pnpm dev`, navigate to `http://localhost:3000/portfolio`:

1. Click (or Tab to and press Enter/Space on) a gallery thumbnail to open
   the lightbox. Note which thumbnail you used.
2. Press Escape. Confirm (via browser DevTools' "inspect" on the focused
   element, or by pressing Tab once and observing where focus visibly
   lands next) that focus returned to the **same thumbnail button** you
   opened, not `<body>`.
3. Repeat, this time closing via the visible "Close lightbox" button
   (click it, or Tab to it and press Enter). Confirm the same result.
4. Open a *different* (e.g. third) gallery item specifically, and repeat
   both close paths. Confirm focus returns to that third item's
   thumbnail specifically, not always the first thumbnail — this
   specifically guards against the `activeIndex`-timing regression
   described in "Current state" (i.e., confirms the ordering fix in Step 1
   actually avoids the `triggerRefs.current[0]` fallback bug).
5. Confirm the fade-out animation (200ms) still plays visually — this
   plan does not remove or shorten the delay, only reorders what happens
   inside it.

## Test plan

Check whether a test file already exists for this component or hook:
`ls components/ui/Lightbox.test.tsx lib/hooks/useLightboxGallery.test.ts`
(or similar naming — check the repo's actual test-file convention, e.g.
via `find . -name "*.test.ts*" -not -path "*/node_modules/*" -not -path "*/.next/*"`
for the pattern other components/hooks use).

- If a test file exists for either, and the existing suite already has
  component/hook-level tests using a DOM testing library (check
  `package.json` devDependencies for `@testing-library/react` or similar
  — confirm before assuming), add a test asserting: after simulating a
  close (Escape key or close-button click) on an open lightbox, the
  triggering thumbnail element receives focus. Follow the structure of
  whichever existing test file is most similar in shape (a component with
  focus-management behavior) as the pattern to match.
- If no such testing-library infrastructure exists in this repo (likely,
  given the existing 21-test suite is small and this plan's author did
  not find a `Lightbox.test.tsx` during recon), **do not introduce new
  test tooling/dependencies just for this one fix** — rely on the manual
  browser check in Step 3 instead, and note in your final report that
  automated coverage for this interaction doesn't exist yet (a separate,
  larger effort, out of scope here).

**Verify**: `pnpm test` → same or greater pass count than the pre-change
baseline (greater only if you added a new test per the bullet above).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "onRestoreFocus" components/ui/Lightbox.tsx` shows it
      called after `dialogRef.current?.close();` inside the `setTimeout`
      callback in `handleClose`
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, same (or greater, if a test was added) count as
      baseline
- [ ] `pnpm build` exits 0
- [ ] Manual check (Step 3) confirms focus returns to the correct
      triggering thumbnail (not just thumbnail 0) after both Escape-close
      and button-close
- [ ] No files outside `components/ui/Lightbox.tsx` (and, only if a test
      was added, its test file) are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `components/ui/Lightbox.tsx` or `lib/hooks/useLightboxGallery.ts` don't
  match the "Current state" excerpts above (drift since this plan was
  written) — re-read the live files and compare before editing.
- After the fix, the manual check in Step 3 still shows focus landing on
  `<body>` or on the wrong thumbnail — this would mean the root-cause
  analysis above was incomplete (e.g. a browser-specific `<dialog>`
  quirk); report the exact observed behavior (which browser, which close
  path, where focus actually lands) rather than trying additional
  reorderings ad hoc.
- You find that `onClose()` (the callback passed in from
  `FeaturedWorkGrid.tsx` / `GalleryGrid.tsx`, wherever `<Lightbox>` is
  rendered) does something time-sensitive that this reorder would break —
  check both call sites before assuming it's side-effect-free beyond
  `setActiveIndex(null)`.

## Maintenance notes

- If this component is ever refactored to not use the native `<dialog>`
  element (e.g. switched to a custom overlay), this entire class of
  "focus scope blocks the restore call" bug goes away, but a *manual*
  focus trap would then need to be implemented, which native `<dialog>`
  currently provides for free — a reviewer should treat that as a much
  bigger change than this plan, not a natural follow-on.
- A reviewer should double check the `activeIndex`-before-`onClose()`
  ordering explanation in "Current state" holds by reading
  `useLightboxGallery.ts`'s `close()` (`setActiveIndex(null)`) alongside
  wherever `onClose` is actually passed to `<Lightbox>` — if a future
  change makes `onClose` synchronous-and-immediate in a way that
  resets `activeIndex` *before* this component's own `setTimeout` fires
  (unlikely given the current structure, but worth a second look if
  either file changes), the same class of bug could reappear in reverse.
