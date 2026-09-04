# Plan 017: Extract shared skeleton blocks from route `loading.tsx` files

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 240e4f8..HEAD -- "app/(site)/loading.tsx" "app/(site)/about/loading.tsx" "app/(site)/contact/loading.tsx" "app/(site)/how-it-works/loading.tsx" "app/(site)/portfolio/loading.tsx"`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `240e4f8`, 2026-08-07

## Why this matters

Five `loading.tsx` files (`app/(site)/loading.tsx`,
`app/(site)/about/loading.tsx`, `app/(site)/contact/loading.tsx`,
`app/(site)/how-it-works/loading.tsx`, `app/(site)/portfolio/loading.tsx`)
each render a full-page skeleton, and two specific blocks are copy-pasted
verbatim (or near-verbatim, differing only in a width utility class) across
several of them:

1. A **"page header" skeleton** — a small pill + two/three stacked headline
   bars — appears in `about`, `contact`, `how-it-works`, and `portfolio`
   (4 files), each a copy with only the pill width and headline-bar widths
   tweaked.
2. A **"CTA band" skeleton** — a bordered card with a heading/description on
   one side and two button-shaped bars on the other — appears in `about`,
   `how-it-works`, `portfolio`, and the root `(site)` loading state (4
   files), identical except for two width values.

Any future change to these skeletons — e.g. matching a real design change to
`CtaBand.tsx`'s spacing, or adjusting the shared page-header layout — means
finding and editing the same block in 4 separate files by hand, and it's easy
to miss one (which is exactly how these five files already show minor
inconsistencies: differing corner-rounding classes, slightly different gap
values). Extracting `PageHeaderSkeleton` and `CtaBandSkeleton` components
collapses each pattern to one implementation.

## Current state

- The **page-header skeleton** block, as it appears (with minor width
  variations) in `app/(site)/about/loading.tsx:5-10`:

```tsx
<div className="my-12 max-w-2xl">
  <div className="h-6 w-20 bg-bg-inset rounded-sm mb-4" />
  <div className="h-28 md:h-36 w-full bg-bg-inset rounded-sm mb-1" />
  <div className="h-28 md:h-36 w-full bg-bg-inset rounded-sm mb-1" />
  <div className="h-28 md:h-36 w-1/2 bg-bg-inset rounded-sm" />
</div>
```

  The same shape in `app/(site)/contact/loading.tsx:5-8` (2 headline bars,
  not 3, pill width `w-24`):

```tsx
<div className="my-12 max-w-2xl">
  <div className="h-6 w-24 bg-bg-inset rounded-sm mb-4" />
  <div className="h-28 md:h-36 w-full bg-bg-inset rounded-sm mb-1" />
  <div className="h-28 md:h-36 w-2/5 bg-bg-inset rounded-sm" />
</div>
```

  And in `app/(site)/how-it-works/loading.tsx:5-8` (pill `w-28`, last bar
  `w-3/5`), and `app/(site)/portfolio/loading.tsx:5-8` (pill `w-24`, last bar
  `w-1/2`). The number of full-width bars before the final partial-width bar
  varies (2 or 3) — this is the one real parameter, along with the pill
  width and the final bar's width class.

- The **CTA-band skeleton** block, as it appears in
  `app/(site)/about/loading.tsx:81-91`:

```tsx
<div className="my-8 rounded-card border border-border-subtle px-8 md:px-12 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
  <div className="space-y-2">
    <div className="h-10 w-64 bg-bg-inset rounded-sm" />
    <div className="h-4 w-72 bg-bg-inset rounded" />
  </div>
  <div className="flex gap-3">
    <div className="h-10 w-32 bg-bg-inset rounded-button" />
    <div className="h-10 w-32 bg-bg-inset rounded-button" />
  </div>
</div>
```

  This exact block (only the first bar's width varies: `w-64` in `about`,
  `w-64` in `how-it-works`, `w-56` in `portfolio`, `w-48` in the root
  `(site)/loading.tsx`) also appears at `app/(site)/how-it-works/loading.tsx:70-80`,
  `app/(site)/portfolio/loading.tsx:27-37`, and `app/(site)/loading.tsx:70-80`.
  `contact/loading.tsx` does not have a CTA band (the contact page doesn't
  render one), so it's untouched by this part of the plan.

- No shared skeleton/loading-UI components exist yet in `components/ui/` —
  this plan creates the first ones. Follow the existing prop-driven
  component convention seen in `components/ui/CtaBand.tsx` (typed props
  object, sensible defaults) rather than inventing a new style.
- The real `components/ui/CtaBand.tsx` component (shown in full during
  recon) is what these skeletons are approximating the shape of — do not
  make the skeleton import or depend on the real component; it stays a
  static placeholder, just de-duplicated.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|-------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Lint      | `pnpm lint`              | exit 0              |
| Tests     | `pnpm test`              | all pass            |
| Build     | `pnpm build`             | exit 0              |

## Scope

**In scope**:
- `components/ui/PageHeaderSkeleton.tsx` (new file)
- `components/ui/CtaBandSkeleton.tsx` (new file)
- `app/(site)/loading.tsx`
- `app/(site)/about/loading.tsx`
- `app/(site)/contact/loading.tsx`
- `app/(site)/how-it-works/loading.tsx`
- `app/(site)/portfolio/loading.tsx`

**Out of scope** (do NOT touch, even though they look related):
- The real `components/ui/CtaBand.tsx` component — not a skeleton, don't
  touch it.
- The repeated outer wrapper className
  (`w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto`) that appears on
  both the loading files and the real page files — that pattern spans
  production pages too, not just loading states, and consolidating it is a
  separate, larger change. Leave every file's outer wrapper `<div>` exactly
  as-is; only replace the *inner* header/CTA-band blocks.
- Any skeleton content that is NOT one of the two duplicated blocks
  identified above (hero skeleton, process-step skeleton, gallery-grid
  skeleton, form-field skeleton, etc.) — those are each specific to one
  file and are not duplicated, leave them inline.

## Git workflow

- Branch: `advisor/017-dedupe-loading-skeletons`
- Commit per step; conventional-commit style matching `git log` (e.g.
  `refactor: extract duplicated texture overlays into shared utilities`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `components/ui/PageHeaderSkeleton.tsx`

```tsx
export function PageHeaderSkeleton({
  pillWidth = "w-24",
  lastLineWidth = "w-1/2",
  lineCount = 3,
}: {
  pillWidth?: string;
  lastLineWidth?: string;
  lineCount?: 2 | 3;
}) {
  return (
    <div className="my-12 max-w-2xl">
      <div className={`h-6 ${pillWidth} bg-bg-inset rounded-sm mb-4`} />
      {Array.from({ length: lineCount - 1 }).map((_, i) => (
        <div
          key={i}
          className="h-28 md:h-36 w-full bg-bg-inset rounded-sm mb-1"
        />
      ))}
      <div className={`h-28 md:h-36 ${lastLineWidth} bg-bg-inset rounded-sm`} />
    </div>
  );
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Create `components/ui/CtaBandSkeleton.tsx`

```tsx
export function CtaBandSkeleton({
  headingWidth = "w-64",
}: {
  headingWidth?: string;
}) {
  return (
    <div className="my-8 rounded-card border border-border-subtle px-8 md:px-12 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <div className="space-y-2">
        <div className={`h-10 ${headingWidth} bg-bg-inset rounded-sm`} />
        <div className="h-4 w-72 bg-bg-inset rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-bg-inset rounded-button" />
        <div className="h-10 w-32 bg-bg-inset rounded-button" />
      </div>
    </div>
  );
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Replace the duplicated blocks in each `loading.tsx`

For each file below, replace the matching block (shown in "Current state")
with a call to the new component, and add the import. Do not change
anything else in the file.

- `app/(site)/about/loading.tsx`: import `PageHeaderSkeleton` and
  `CtaBandSkeleton` from `@/components/ui/PageHeaderSkeleton` and
  `@/components/ui/CtaBandSkeleton`. Replace the header block with
  `<PageHeaderSkeleton pillWidth="w-20" lastLineWidth="w-1/2" lineCount={3} />`
  and the CTA block with `<CtaBandSkeleton headingWidth="w-64" />`.
- `app/(site)/contact/loading.tsx`: import `PageHeaderSkeleton` only (no CTA
  band on this page). Replace the header block with
  `<PageHeaderSkeleton pillWidth="w-24" lastLineWidth="w-2/5" lineCount={2} />`.
- `app/(site)/how-it-works/loading.tsx`: import both. Replace the header
  block with
  `<PageHeaderSkeleton pillWidth="w-28" lastLineWidth="w-3/5" lineCount={3} />`
  and the CTA block with `<CtaBandSkeleton headingWidth="w-64" />`.
- `app/(site)/portfolio/loading.tsx`: import both. Replace the header block
  with `<PageHeaderSkeleton pillWidth="w-24" lastLineWidth="w-1/2" lineCount={3} />`
  and the CTA block with `<CtaBandSkeleton headingWidth="w-56" />`.
- `app/(site)/loading.tsx`: this file's hero skeleton is structurally
  different (no page-header block — leave it alone). Import
  `CtaBandSkeleton` only and replace its CTA block with
  `<CtaBandSkeleton headingWidth="w-48" />`.

After each file, re-check the width values you passed against the "Current
state" excerpts (or the live file if it's one not quoted in full above) —
the goal is a pixel-identical skeleton, not an approximation.

**Verify** (after each file): `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

**Verify**: all four exit 0.

## Test plan

No new automated tests — this is presentational skeleton markup with no
logic to unit test. Verification is visual: run `pnpm dev`, throttle network
in devtools (or add a temporary artificial delay to one of the `page.tsx`
files' data fetch, then remove it) to trigger each loading state, and
confirm each of the 5 routes (`/`, `/about`, `/contact`, `/how-it-works`,
`/portfolio`) renders a skeleton visually identical to before the refactor —
same bar widths, same spacing. Since the extraction is parameterized to
reproduce the exact widths from "Current state", a visual diff should show
no change.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `components/ui/PageHeaderSkeleton.tsx` and `components/ui/CtaBandSkeleton.tsx` both exist
- [ ] `grep -rl "PageHeaderSkeleton" "app/(site)/about/loading.tsx" "app/(site)/contact/loading.tsx" "app/(site)/how-it-works/loading.tsx" "app/(site)/portfolio/loading.tsx"` returns all 4 files
- [ ] `grep -rl "CtaBandSkeleton" "app/(site)/about/loading.tsx" "app/(site)/how-it-works/loading.tsx" "app/(site)/portfolio/loading.tsx" "app/(site)/loading.tsx"` returns all 4 files
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the five `loading.tsx` files no longer contains the exact block
  quoted in "Current state" (widths, class names) — the repo has drifted;
  re-derive the correct prop values from the live file instead of guessing,
  and if the block's *structure* (not just widths) has changed, STOP instead
  of trying to force it through the new component's prop shape.
- A `loading.tsx` file has more than one page-header or CTA-band block (none
  currently do) — don't collapse multiple instances into one without
  confirming that's intended.

## Maintenance notes

- If the real `CtaBand.tsx` component's visual shape changes (spacing,
  border radius, button sizing), update `CtaBandSkeleton.tsx` to match —
  it's now one file instead of four.
- The outer page-wrapper className duplication
  (`w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto`) noted in "Out of
  scope" is a separate, lower-priority cleanup — flagged here for whoever
  picks it up next, not fixed by this plan.
- A reviewer should scrutinize: that every width prop passed in Step 3
  matches the original file's value exactly (a visual regression here would
  be a skeleton that "jumps" slightly when the real content loads in).
