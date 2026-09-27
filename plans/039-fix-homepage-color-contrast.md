# Plan 039: Fix two homepage color-contrast failures

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0dc6441..HEAD -- "app/(site)/page.tsx"`
> If it changed since this plan was written, compare the "Current state"
> excerpts below against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug (accessibility)
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

Plan 037's production Lighthouse pass (2026-09-27) flagged 3 elements on
the homepage failing WCAG AA text contrast (≥4.5:1). This plan's author
traced all 3 to their actual source (the report's own CSS selectors didn't
match any file exactly, so each was independently re-found and root-caused
by reading the code and `app/component-tokens.css`/`app/globals.css`
directly — the two are genuinely different bugs, not one issue reported
twice):

**Bug A — wrong token pairing on the Hero "Now Booking" badge.** This
codebase already has a *correct*, pre-tuned, documented color pair for
gold-surface buttons: `components/ui/Button.tsx`'s primary variant pairs
`bg-button-primary-surface` with `text-button-primary-text`
(`--button-primary-text: var(--color-neutral-950)` — near-black, giving
gold(L72%) + ink(L12%) ≈ **8.4:1, AAA**, per the contrast note documented
directly above it in `app/component-tokens.css:17-28`). The homepage
Hero's "Now Booking" badge link uses the *same* gold surface
(`bg-button-primary-surface`) but pairs it with the wrong text token —
`text-text-inverse` (a *different* token meant for pairing with
`bg-inverse` dark/light-flip surfaces, not this gold surface) — producing
the audit's measured **2.26:1** failure. The fix is to swap the mismatched
text token for the one this exact surface color was already designed to
pair with.

**Bug B — a raw, untuned opacity modifier instead of the repo's existing
tuned token.** The homepage's "How It Works" section
(`app/(site)/page.tsx:205-237`) sits inside a `[data-inverse]`-scoped
`<section>` and uses `text-text-inverse/40` (a raw 40%-opacity Tailwind
modifier) twice for secondary/tertiary-style labels. This codebase has
already solved exactly this problem elsewhere: `app/globals.css`'s
`[data-inverse]` block remaps `--text-tertiary` to a specifically-tuned,
documented-contrast value for use inside inverse sections (light mode:
`oklch(62% 0.02 75)`, documented "5.57:1 on ink... AA on every dark
surface"). The `/40` opacity usages bypass that existing, already-correct
token entirely, producing the audit's measured **3.41:1** failure (below
the 4.5:1 AA bar for normal text). The fix is to use the semantic
`text-text-tertiary` utility (which resolves to the pre-tuned value inside
this `[data-inverse]` scope) instead of the raw opacity modifier.

Both fixes replace an ad hoc/mismatched utility with a token this
codebase *already built and tuned for exactly this situation* — no new
color values, no new tokens, no design decision needed.

## Current state

`app/(site)/page.tsx:48-56` (Hero "Now Booking" badge, verified by direct
read):

```tsx
        {siteInfo.booking.visible && (
          <TransitionLink
            href="/contact"
            className="flex items-center gap-2 font-mono text-xs lg:text-sm xl:text-base font-black tracking-widest uppercase text-text-inverse bg-button-primary-surface px-3 py-1 hover:bg-button-primary-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <PulseDot color="bg-bg-base" opacity="opacity-60" />
            Now Booking — {siteInfo.booking.label}
          </TransitionLink>
        )}
```

For comparison, `components/ui/Button.tsx:11` (the repo's own correct
pairing convention for this surface — read-only reference, not modified
by this plan):

```tsx
"relative z-0 overflow-hidden border-2 border-button-primary-border bg-button-primary-surface text-button-primary-text hover:text-button-primary-text-hover before:absolute before:inset-0 before:-z-10 before:bg-button-primary-surface-hover before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top active:before:bg-button-primary-surface-active"
```

`app/component-tokens.css:15-36` (the documented contrast rationale for
this exact surface/text pairing — read-only reference):

```css
:root {
  /* ── Buttons ──────────────────────────────────────────────────────────────
   * Text contrast (SC 1.4.3):
   *   Primary: gold (L 72%) + ink text (L 12%) ≈ 8.4:1 (AAA ✓).
   *   ...
   * ──────────────────────────────────────────────────────────────────────── */
  --button-primary-surface: var(--color-primary-400);
  --button-primary-surface-hover: oklch(
    78% 0.16 75
  ); /* mid-step between primary-300 (82%) and primary-400 (72%) — intentional bespoke hover brightness */
  --button-primary-surface-active: var(--color-primary-500);
  --button-primary-text: var(--color-neutral-950);
  --button-primary-text-hover: var(--color-neutral-950);
  --button-primary-border: transparent; /* gold vs ink ≈ 8.1:1 — shape passes without border */
```

`app/(site)/page.tsx:205-237` (the "How It Works" section, verified by
direct read — only lines 213–214 and 227 need to change):

```tsx
  return (
    <section
      className="bg-bg-inverse -mx-4 md:-mx-6 lg:-mx-8 xl:-mx-12"
      data-inverse
    >
      <div className="w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto px-4 md:px-6 lg:px-8 xl:px-12 pt-20 pb-32">
        <SectionLabel
          className="mb-16"
          lineColor="bg-text-inverse/30"
          textColor="text-text-inverse/40"
        >
          Index 02 — How It Works
        </SectionLabel>

        {/* Heading row */}
        <div className="mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <h2 className="font-display font-black uppercase leading-[0.85] text-[clamp(4rem,10vw,8rem)] text-text-inverse">
            Our
            <br />
            Process<span className="text-gold">.</span>
          </h2>
          <div className="flex flex-col items-start lg:items-end gap-3 lg:pb-2 shrink-0">
            <p className="font-mono text-xs uppercase tracking-widest text-text-inverse/40">
              Three Steps, Start to Finish
            </p>
```

`app/globals.css`'s `[data-inverse]` remap block (verified by direct
read — this is what makes `text-text-tertiary` resolve correctly inside
this exact section; read-only reference, not modified by this plan):

```css
/* Light mode: bg-inverse = ink → remap to ink-surface values */
.light [data-inverse] {
  --foreground: var(--color-neutral-100);
  ...
  --text-secondary: var(--color-neutral-300);
  --text-tertiary: oklch(
    62% 0.02 75
  ); /* 5.57:1 on ink, 5.33:1 on neutral-800, 4.76:1 on neutral-700 — AA on every dark surface (was 58%, 4.04:1 on neutral-700) */
  ...
```

(A corresponding dark-mode `[data-inverse]` block exists too, remapping
for the opposite surface flip — confirm both exist and both remap
`--text-tertiary` before assuming only one theme needs the fix.)

**`lineColor="bg-text-inverse/30"` (line 213) is a separate prop on
`SectionLabel`, for a thin divider line, not text** — check
`components/ui/SectionLabel.tsx` to confirm what it's used for before
deciding whether it needs the same fix. Lighthouse's contrast audit only
flags *text*, so a background/border-only usage of `/30` may not need to
change at all — verify this in Step 1 before touching it, rather than
assuming both `/30` and `/40` need the same treatment.

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
- `app/(site)/page.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `app/component-tokens.css`, `app/globals.css` — no new tokens or value
  changes needed; both fixes reuse tokens that already exist and are
  already correctly tuned.
- `components/ui/Button.tsx` — reference only, not modified.
- `components/ui/SectionLabel.tsx` — check its `lineColor`/`textColor`
  prop usage to confirm what each renders (Step 1), but only change the
  *call site* in `page.tsx` (the values passed in), not the component
  itself, unless the component hardcodes something that prevents the fix
  — if so, STOP and report rather than restructuring the component.
- Any other page's use of `text-text-inverse` or `bg-button-primary-surface`
  — this plan fixes only the two homepage instances Lighthouse flagged;
  a sitewide grep for the same anti-patterns is worth doing as a *separate*
  follow-up, not bundled into this fix (see "Maintenance notes").

## Git workflow

- Branch: none required, or `advisor/039-homepage-contrast` — LOW risk,
  single-file, few-line change.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `fix: correct color-contrast failures on homepage`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Check what `SectionLabel`'s `lineColor` prop actually renders

Read `components/ui/SectionLabel.tsx` and find where its `lineColor` prop
is applied (background of a divider line/rule, most likely, given the
name and the `bg-` prefix on the value passed in). Confirm it is **not**
applied to any text content — if it is purely decorative (a colored line,
not text), it is not subject to WCAG 1.4.3 text-contrast requirements and
this plan leaves `lineColor="bg-text-inverse/30"` unchanged.

**Verify**: you can state in one sentence what DOM element `lineColor`'s
value is applied to, and confirm it renders no text content.

### Step 2: Fix the Hero "Now Booking" badge's text color

In `app/(site)/page.tsx`, in the `Hero` function, replace:

```tsx
            className="flex items-center gap-2 font-mono text-xs lg:text-sm xl:text-base font-black tracking-widest uppercase text-text-inverse bg-button-primary-surface px-3 py-1 hover:bg-button-primary-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
```

with:

```tsx
            className="flex items-center gap-2 font-mono text-xs lg:text-sm xl:text-base font-black tracking-widest uppercase text-button-primary-text bg-button-primary-surface px-3 py-1 hover:bg-button-primary-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
```

(Only `text-text-inverse` → `text-button-primary-text` changes. Everything
else — the `bg-button-primary-surface`, hover state, focus ring, layout
classes — stays exactly as-is.)

Also check the `<PulseDot color="bg-bg-base" opacity="opacity-60" />`
child on the line just below — this renders a small dot using `bg-bg-base`,
a separate token not flagged by the audit. Leave it unchanged; it is out
of scope for this plan.

**Verify**: `grep -n "text-button-primary-text bg-button-primary-surface" "app/(site)/page.tsx"`
returns a match.

### Step 3: Fix the "How It Works" section's tertiary-text color

In `app/(site)/page.tsx`, in the "How It Works" section, replace:

```tsx
        <SectionLabel
          className="mb-16"
          lineColor="bg-text-inverse/30"
          textColor="text-text-inverse/40"
        >
```

with (only if Step 1 confirmed `lineColor` is decorative-only — otherwise
STOP and report):

```tsx
        <SectionLabel
          className="mb-16"
          lineColor="bg-text-inverse/30"
          textColor="text-text-tertiary"
        >
```

and replace:

```tsx
            <p className="font-mono text-xs uppercase tracking-widest text-text-inverse/40">
              Three Steps, Start to Finish
            </p>
```

with:

```tsx
            <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
              Three Steps, Start to Finish
            </p>
```

**Verify**: `grep -n "text-text-inverse/40" "app/(site)/page.tsx"` returns
no matches. `grep -n "text-text-tertiary" "app/(site)/page.tsx"` returns
at least 2 matches (both replacements from this step).

### Step 4: Full verification sweep

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.

**Verify**: all four exit 0, `pnpm test` reports the same pass count as a
pre-change baseline.

### Step 5: Manual visual + contrast confirmation

Run `pnpm dev`, load `http://localhost:3000/` in a browser:

1. Confirm the "Now Booking" badge (top-right of the Hero, when
   `siteInfo.booking.visible` is true) now renders dark/near-black text on
   the gold surface, not light/cream text — should look visually similar
   in *hue* to the site's other primary buttons (e.g. the "Get a Quote"
   button just below it), since it now uses the same text token.
2. Scroll to the "How It Works" section (dark/inverse band). Confirm
   "Index 02 — How It Works" (the `SectionLabel`) and "Three Steps, Start
   to Finish" are legible against the dark background — should look
   slightly *more* visible/less faint than before, since the fix raises
   contrast from ~3.4:1 to ~5.6:1.
3. If you have access to a contrast-checking tool (browser DevTools'
   color picker reports contrast ratio directly on hover in Chrome/Edge),
   spot-check both fixed elements read ≥4.5:1 against their background.
4. Toggle dark mode (footer theme toggle) and repeat steps 1–2 — confirm
   both fixes hold in both themes (both light-mode and dark-mode
   `[data-inverse]` remap blocks exist in `globals.css`; this check
   confirms the dark-mode remap is equally correct, not just assumed).

## Test plan

No new automated tests — these are CSS utility-class swaps with no
testable application logic (no new conditional behavior, no new
function). The existing `pnpm test` suite is the regression guard: if
either component has a snapshot test asserting the old class strings,
it needs updating (see "STOP conditions").

**Verify**: `pnpm test` → same pass/fail count as a pre-change baseline,
unless a snapshot test needed updating per the STOP condition below (in
which case, only that snapshot's expected value should change).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "text-button-primary-text bg-button-primary-surface" "app/(site)/page.tsx"` matches
- [ ] `grep -n "text-text-inverse/40" "app/(site)/page.tsx"` — no matches
- [ ] `grep -n "text-text-tertiary" "app/(site)/page.tsx"` returns at
      least 2 matches
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, same count as baseline
- [ ] `pnpm build` exits 0
- [ ] Manual check (Step 5) confirms both fixes render correctly in both
      light and dark theme
- [ ] No files outside `app/(site)/page.tsx` are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `app/(site)/page.tsx` doesn't match the "Current state"
  excerpts above (drift since this plan was written).
- Step 1 finds that `SectionLabel`'s `lineColor` prop DOES apply to text
  content (not just a decorative line) — this would mean the `/30`
  divider-line usage also needs a fix, which this plan doesn't currently
  scope; report what you found rather than guessing at an additional fix.
- `--text-tertiary` is not actually remapped inside the dark-mode
  `[data-inverse]` block in `app/globals.css` (only confirmed for
  light mode above) — if the dark-mode remap doesn't exist or resolves to
  a low-contrast value, Step 3's fix could make dark mode *worse* instead
  of better; verify both theme blocks before proceeding past Step 3, and
  report if only one theme is actually covered.
- Any test snapshot fails after Step 2 or Step 3 in a way that's clearly
  asserting on the exact class string being changed (as opposed to
  testing something else that happens to touch these classes) — update
  only that specific snapshot; if the failure looks unrelated, STOP and
  report instead of updating blindly.

## Maintenance notes

- This plan intentionally fixes only the two flagged instances, not every
  occurrence of `text-text-inverse` or `bg-button-primary-surface`
  sitewide. A worthwhile follow-up (not part of this plan): grep the
  whole codebase for `text-text-inverse` paired with any `bg-button-*`
  surface (the same class of mismatch as Bug A) and for any other raw
  `text-text-inverse/NN` opacity modifiers (the same class of mismatch as
  Bug B), to catch any other instances Lighthouse's page-by-page audit
  didn't happen to sample.
- The underlying lesson for future homepage/section work: this codebase
  has already solved "text contrast on an inverse surface" via the
  `[data-inverse]` attribute + token-remap pattern in `globals.css` — new
  sections using `bg-bg-inverse` should reach for `text-text-tertiary`
  (or `-secondary`, `-primary` as appropriate) rather than reaching for a
  raw opacity modifier on `text-inverse`, since the remap only exists for
  the semantic tokens, not for ad hoc opacity values.
