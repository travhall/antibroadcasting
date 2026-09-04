# Plan 016: Extract shared lightbox-orchestration hook from GalleryGrid and FeaturedWorkGrid

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 240e4f8..HEAD -- components/ui/GalleryGrid.tsx components/ui/FeaturedWorkGrid.tsx`
> If either in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `240e4f8`, 2026-08-07

## Why this matters

`GalleryGrid.tsx` and `FeaturedWorkGrid.tsx` both render a grid of
`GalleryItem`s that open into a shared `Lightbox` via a portal, and both
independently implement the exact same ~20-line state machine to do it:
`activeIndex` state, a `triggerRefs` array for focus restoration, and
`open`/`close`/`prev`/`next`/`restoreFocus` callbacks. The two copies are
currently byte-for-byte identical in logic (only the JSX around them
differs). That means any future change to lightbox interaction — e.g. wrap-
around navigation, keyboard shortcuts, analytics on open — has to be applied
twice, and the two copies have already started drifting in presentation
(`FeaturedWorkGrid` passes `categoryLabel="Garment"` to `Lightbox`,
`GalleryGrid` doesn't) which is a preview of how the *logic* will silently
diverge too if left alone. Extracting a `useLightboxGallery(items)` hook
collapses this to one implementation both grids call.

## Current state

- `components/ui/GalleryGrid.tsx` — exports `GalleryItem` type (also imported
  by `FeaturedWorkGrid.tsx` and `Lightbox.tsx`), a `GalleryCard` subcomponent,
  and `GalleryGrid`. The duplicated block, `components/ui/GalleryGrid.tsx:170-224`:

```tsx
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sizes = assignSizes(items);

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

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-12 lg:gap-x-6 lg:gap-y-14">
        {items.map((item, index) => (
          <GalleryCard
            key={item.slug}
            item={item}
            index={index}
            size={sizes[index]}
            onOpen={open}
            triggerRef={(el) => {
              triggerRefs.current[index] = el;
            }}
          />
        ))}
      </div>

      {activeItem &&
        createPortal(
          <Lightbox
            item={activeItem}
            items={items}
            onClose={close}
            onPrev={prev}
            onNext={next}
            onRestoreFocus={restoreFocus}
          />,
          document.body,
        )}
    </>
  );
}
```

- `components/ui/FeaturedWorkGrid.tsx` — the identical block, lines 15-33,
  followed by different JSX (a 3-item hero layout instead of a full grid) and
  a `categoryLabel="Garment"` prop passed to `Lightbox` that `GalleryGrid`
  doesn't pass:

```tsx
export function FeaturedWorkGrid({ items }: { items: GalleryItem[] }) {
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[5fr_4fr_3fr] gap-5 items-start">
        {items.slice(0, 3).map((item, i) => (
          <div key={item.slug} className={i === 1 ? "md:mt-20" : ""}>
            <button
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              onClick={() => open(i)}
              aria-label={`View ${item.client ?? item.title}`}
              className="group relative w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* ...image, texture, badge, placeholder, scrim... (unchanged, out of scope) */}
            </button>
            {/* ...metadata block... (unchanged, out of scope) */}
          </div>
        ))}
      </div>

      {activeItem &&
        createPortal(
          <Lightbox
            item={activeItem}
            items={items}
            categoryLabel="Garment"
            onClose={close}
            onPrev={prev}
            onNext={next}
            onRestoreFocus={restoreFocus}
          />,
          document.body,
        )}
    </>
  );
}
```

- Both files currently import `useState`, `useCallback`, `useRef` from
  `"react"` and `createPortal` from `"react-dom"` for this purpose.
- `components/ui/Lightbox.tsx` — the consumer; its prop contract (`item`,
  `items`, `categoryLabel?`, `onClose`, `onPrev`, `onNext`, `onRestoreFocus`)
  is unchanged by this plan — only *who computes those props* moves into the
  new hook.
- Existing hooks convention: `lib/hooks/useTheme.ts` is the one hook already
  in the repo, exported as a named function from `lib/hooks/<name>.ts`. Match
  that location and export style for the new hook.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|-------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Lint      | `pnpm lint`              | exit 0              |
| Tests     | `pnpm test`              | all pass            |
| Build     | `pnpm build`             | exit 0              |

## Scope

**In scope**:
- `lib/hooks/useLightboxGallery.ts` (new file)
- `components/ui/GalleryGrid.tsx`
- `components/ui/FeaturedWorkGrid.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `components/ui/Lightbox.tsx` — its prop contract is the boundary this hook
  targets; do not change its props or internals.
- The JSX/markup differences between `GalleryGrid` and `FeaturedWorkGrid`
  (grid layout, card styling, `categoryLabel`) — those are intentional
  presentational differences, not duplication to remove. Only the
  state/callbacks move into the shared hook.
- `assignSizes`, `colSpan`, `imageAspect`, `imageSizes`, `GalleryCard` in
  `GalleryGrid.tsx` — unrelated to the lightbox state, leave as-is.

## Git workflow

- Branch: `advisor/016-extract-lightbox-gallery-hook`
- Commit per step; conventional-commit style matching `git log` (e.g.
  `refactor: extract duplicated texture overlays into shared utilities`,
  commit `90e92bc`, is the closest precedent for this exact kind of change).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `lib/hooks/useLightboxGallery.ts`

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

This is a direct, mechanical extraction of the block shown in "Current
state" — same variable names, same logic, no behavior change. The one
addition is `setTriggerRef`, a small factory that replaces the inline arrow
function both call sites wrote by hand (`(el) => { triggerRefs.current[i] =
el; }`) — purely to avoid a third copy of that pattern; it does not change
what gets stored in the ref array.

**Verify**: `pnpm exec tsc --noEmit` → exit 0 (new file typechecks standalone
since nothing imports it yet).

### Step 2: Wire `GalleryGrid.tsx` to the hook

Replace lines 170-192 (the `GalleryGrid` function body up to and including
the `next` callback) with:

```tsx
import { useLightboxGallery } from "@/lib/hooks/useLightboxGallery";
// (remove the now-unused useState, useCallback, useRef import specifiers
// if GalleryCard or assignSizes don't use them — check before removing;
// GalleryCard does not use any of the three, so the import line becomes
// `import { useRef } from "react";` only if still needed elsewhere in the
// file, otherwise remove the react hooks import entirely and keep
// `createPortal` from "react-dom")

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const sizes = assignSizes(items);
  const { activeItem, open, close, prev, next, restoreFocus, setTriggerRef } =
    useLightboxGallery(items);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-12 lg:gap-x-6 lg:gap-y-14">
        {items.map((item, index) => (
          <GalleryCard
            key={item.slug}
            item={item}
            index={index}
            size={sizes[index]}
            onOpen={open}
            triggerRef={setTriggerRef(index)}
          />
        ))}
      </div>

      {activeItem &&
        createPortal(
          <Lightbox
            item={activeItem}
            items={items}
            onClose={close}
            onPrev={prev}
            onNext={next}
            onRestoreFocus={restoreFocus}
          />,
          document.body,
        )}
    </>
  );
}
```

Check the top-of-file `import { useState, useCallback, useRef } from
"react";` line: `GalleryCard` and the rest of the file don't use any of
these three (confirm with `grep -n "useState\|useCallback\|useRef" components/ui/GalleryGrid.tsx`
after this edit — the only remaining hits should be inside the new import
from `useLightboxGallery`, i.e. none in this file). Remove the react-hooks
import line entirely if so.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Wire `FeaturedWorkGrid.tsx` to the hook

Same transformation. Replace lines 15-33 (the state/callbacks block) with:

```tsx
import { useLightboxGallery } from "@/lib/hooks/useLightboxGallery";

export function FeaturedWorkGrid({ items }: { items: GalleryItem[] }) {
  const { activeItem, open, close, prev, next, restoreFocus, setTriggerRef } =
    useLightboxGallery(items);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[5fr_4fr_3fr] gap-5 items-start">
        {items.slice(0, 3).map((item, i) => (
          <div key={item.slug} className={i === 1 ? "md:mt-20" : ""}>
            <button
              ref={setTriggerRef(i)}
              onClick={() => open(i)}
              aria-label={`View ${item.client ?? item.title}`}
              className="group relative w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* ...unchanged image/texture/badge/placeholder/scrim JSX... */}
            </button>
            {/* ...unchanged metadata block... */}
          </div>
        ))}
      </div>

      {activeItem &&
        createPortal(
          <Lightbox
            item={activeItem}
            items={items}
            categoryLabel="Garment"
            onClose={close}
            onPrev={prev}
            onNext={next}
            onRestoreFocus={restoreFocus}
          />,
          document.body,
        )}
    </>
  );
}
```

Do not touch the JSX inside the `<button>` or the metadata block below it —
only the state setup at the top of the function and the `ref`/`onClick`
wiring on the trigger button change. Remove the now-unused
`useState, useCallback, useRef` import from `"react"` at the top of the file
(confirm nothing else in this file uses them first).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

**Verify**: all four exit 0.

## Test plan

No unit tests exist for these components today (this repo's only test file
is `app/api/send/route.test.ts`, testing the API route, not UI components) —
this plan does not introduce a component-testing setup, since that's a
larger, separate investment out of scope here. Verification is: (a)
`pnpm build` succeeding (catches type/import errors), and (b) a manual
browser check — run `pnpm dev`, open `/` (uses `FeaturedWorkGrid`) and
`/portfolio` (uses `GalleryGrid`), click a card to open the lightbox,
confirm: it opens on the clicked item, prev/next buttons navigate correctly
at the boundaries (first item's "prev" disabled, last item's "next"
disabled), closing returns focus to the trigger button that opened it. This
is unchanged behavior — the check is that the refactor didn't break it, not
that it validates new functionality.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `lib/hooks/useLightboxGallery.ts` exists and is imported by both `components/ui/GalleryGrid.tsx` and `components/ui/FeaturedWorkGrid.tsx` (`grep -l "useLightboxGallery" components/ui/GalleryGrid.tsx components/ui/FeaturedWorkGrid.tsx` returns both files)
- [ ] `grep -n "const \[activeIndex" components/ui/GalleryGrid.tsx components/ui/FeaturedWorkGrid.tsx` returns no matches (state fully moved into the hook)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code in either file no longer matches the "Current state" excerpts
  (the repo has drifted — e.g. a new prop was added to the lightbox
  callbacks since this plan was written).
- `GalleryCard` or the `FeaturedWorkGrid` JSX turns out to depend on
  `useState`/`useCallback`/`useRef` for something other than the lightbox
  state shown here — if so, don't remove that import, just remove the now-
  redundant lightbox-state lines.
- Manual browser verification (Step in "Test plan") shows the lightbox
  behaves differently after the refactor in either grid.

## Maintenance notes

- Any future lightbox interaction change (new keyboard shortcut, analytics
  event on open, etc.) now belongs in `lib/hooks/useLightboxGallery.ts` —
  touching only `GalleryGrid.tsx` or only `FeaturedWorkGrid.tsx` for such a
  change is a sign it should go in the hook instead.
- A reviewer should scrutinize: that the diff for both grid components is
  purely mechanical (state extraction + import changes), with zero change to
  the rendered JSX structure, class names, or the `Lightbox` prop values
  passed (`categoryLabel="Garment"` must still only appear on the
  `FeaturedWorkGrid` call site).
- If a third gallery-like component is added later that also needs a
  lightbox, it should consume this same hook rather than writing a third
  copy of the state machine.
