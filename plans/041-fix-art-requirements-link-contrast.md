# Plan 041: Fix the color-only "artwork requirements" link on the quote form

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0dc6441..HEAD -- components/ui/QuoteForm.tsx`
> If it changed since this plan was written, compare the "Current state"
> excerpt below against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug (accessibility)
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

Plan 037's production Lighthouse pass (2026-09-27) flagged the "artwork
requirements" link inside the quote form's file-upload helper text: it's
distinguished from the surrounding body text by color alone (no
underline, no weight/style difference), and the color contrast between
the link and the adjacent text is only ~2.18:1 — below the 3:1 minimum
WCAG requires for this "color alone" technique (SC 1.4.1). A low-vision
user, or anyone who has trouble distinguishing the accent color from body
text, can't tell this phrase is a link at all without hovering or
tabbing to it.

This codebase already has an established, existing convention for exactly
this situation elsewhere: `components/ui/AlertBanner.tsx`'s CTA link uses
`underline hover:no-underline` — underlined by default (so it's
distinguishable at rest, satisfying SC 1.4.1 without needing to hunt for a
new color value), removing the underline only on hover as a subtle
interactive flourish. This plan applies that same, already-proven pattern
to the quote form's link rather than introducing a new color or a new
visual treatment.

## Current state

`components/ui/QuoteForm.tsx:302-311` (the file-upload helper text
containing the flagged link, verified by direct read):

```tsx
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
          No art yet? No problem — you can submit without it. Check our{" "}
          <a
            href="/how-it-works#art-requirements"
            className="text-text-accent hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            artwork requirements
          </a>{" "}
          before you send files.
        </p>
```

For comparison, `components/ui/AlertBanner.tsx`'s CTA link (the
established, existing pattern to match — read-only reference, not
modified by this plan):

```tsx
        <TransitionLink
          href={alert.ctaHref}
          className="tap-target font-mono text-xs uppercase tracking-widest underline hover:no-underline text-text-warning shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-warning"
        >
          {alert.ctaLabel}
        </TransitionLink>
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
- `components/ui/QuoteForm.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `components/ui/AlertBanner.tsx` — reference only, not modified.
- Any other `text-text-accent` link elsewhere in the codebase — this plan
  fixes only the one Lighthouse flagged; a sitewide audit for the same
  color-only-link pattern is a worthwhile separate follow-up (see
  "Maintenance notes"), not bundled here.
- The `hover:text-text-primary` color-change-on-hover behavior — keep it;
  this plan only adds an underline, it doesn't change the color scheme.

## Git workflow

- Branch: none required, or `advisor/041-art-requirements-link` — LOW
  risk, single-file, one-line change.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `fix: add underline to color-only artwork-requirements link`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Add a default underline, removed on hover

In `components/ui/QuoteForm.tsx`, replace:

```tsx
          <a
            href="/how-it-works#art-requirements"
            className="text-text-accent hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
```

with:

```tsx
          <a
            href="/how-it-works#art-requirements"
            className="text-text-accent underline hover:text-text-primary hover:no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
```

(Adds `underline` to the base classes and `hover:no-underline` alongside
the existing `hover:text-text-primary` — matching `AlertBanner.tsx`'s
`underline hover:no-underline` pattern exactly. Everything else —
`transition-colors`, the focus-ring classes — stays unchanged.)

**Verify**: `grep -n "underline hover:text-text-primary hover:no-underline" components/ui/QuoteForm.tsx`
returns a match (or an equivalent order — the important part is both
`underline` and `hover:no-underline` are present on this element; exact
class order doesn't matter to Tailwind).

### Step 2: Full verification sweep

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.

**Verify**: all four exit 0, `pnpm test` reports the same pass count as a
pre-change baseline.

### Step 3: Manual visual confirmation

Run `pnpm dev`, load `http://localhost:3000/contact`:

1. Scroll to the "Artwork Files" upload field. Confirm the "artwork
   requirements" phrase in the helper text is now underlined by default
   (visible without hovering).
2. Hover over it. Confirm the underline disappears and the text color
   changes (both the existing color-change and the new underline-removal
   should happen together on hover, matching the AlertBanner CTA's
   established feel).
3. Tab to the link via keyboard. Confirm the existing focus ring still
   renders correctly (unaffected by this change, but worth a quick visual
   check since the className string changed).

## Test plan

No new automated tests — this is a single Tailwind utility-class addition
with no testable application logic. The existing `pnpm test` suite is the
regression guard (unaffected, since no test targets this specific link's
styling).

**Verify**: `pnpm test` → same pass/fail count as a pre-change baseline.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] The "artwork requirements" `<a>` in `components/ui/QuoteForm.tsx`
      has both `underline` and `hover:no-underline` in its class list
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, same count as baseline
- [ ] `pnpm build` exits 0
- [ ] Manual check (Step 3) confirms the underline shows at rest and
      disappears on hover, with the focus ring intact
- [ ] No files outside `components/ui/QuoteForm.tsx` are modified
      (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `components/ui/QuoteForm.tsx:302-311` doesn't match the
  "Current state" excerpt above (drift since this plan was written).
- Adding `underline` visibly clashes with the surrounding text's own
  styling in a way that looks broken (e.g. the underline overlaps
  descenders awkwardly due to a specific font/line-height combination) —
  report a screenshot description rather than trying alternate
  text-decoration properties (`text-decoration-thickness`,
  `underline-offset`) without checking whether this repo has an existing
  convention for those first.

## Maintenance notes

- This plan fixes only the one link Lighthouse's per-page sample happened
  to catch. A worthwhile follow-up: grep the codebase for other inline
  `<a>` elements using `text-text-accent` (or any other accent-only color)
  without an underline, elsewhere in body copy (as opposed to nav
  links/buttons, which are differentiated by position/style, not just
  color, and don't need this treatment) — the Privacy and Terms pages'
  `mailto:` links, for instance, use `text-text-primary` (same as body
  text) with `hover:underline`, which is a different, likely-fine pattern
  since color isn't the differentiator there; but any *other*
  accent-colored inline link in body prose should be checked the same way
  this one was.
