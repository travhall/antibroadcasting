# Plan 040: Investigate and likely fix the homepage/contact LCP regression via the display font's `font-display` strategy

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. **This plan's fix (Step 2) is a hypothesis to
> test empirically, not a guaranteed correct change** — Step 4's
> before/after Lighthouse comparison is what determines whether to keep it,
> not this plan's confidence level. When done, update the status row for
> this plan in `plans/README.md` — unless a reviewer dispatched you and
> told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0dc6441..HEAD -- app/layout.tsx`
> If it changed since this plan was written, compare the "Current state"
> excerpt below against the live file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S/M (the code change is one line; most of the effort is the
  before/after Lighthouse measurement)
- **Risk**: LOW-MED (low risk of breakage, medium risk of a visible
  font-swap flash trading one UX cost for another — see "Why this matters")
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

Plan 037's production Lighthouse pass (2026-09-27) found LCP well above
the 2.5s "good" threshold on both `/` (~4.15s, two runs) and `/contact`
(~3.2–4.0s, two runs) under Lighthouse's default simulated-mobile
throttling. Its own investigation found the LCP element on both pages is
a **text node** — home's intro paragraph, contact's `<h1>` — and that
Lighthouse's own timing breakdown shows that specific text rendering
quickly (tens to a few hundred ms) once its own resource is available,
meaning the multi-second delay is happening *earlier* in the critical
path, before that element paints. Plan 037 recommended investigating
render-blocking resources but did not identify a specific cause.

**This plan's author investigated further and found a much more specific,
testable lead than "check fonts/CSS/JS" in general:**

`app/layout.tsx` defines three fonts via `next/font`. Two use
`display: "swap"` (the standard, recommended setting — show a fallback
font immediately, swap to the real font once loaded, never blocking
paint):

```tsx
const figtreeSans = Figtree({
  variable: "--font-figtree-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
```

The third — the site's distinctive brand display face, used via the
`font-display` Tailwind utility (`--font-display: var(--font-dominique)`,
`app/globals.css:198`) for **every major heading sitewide**, including
both pages' own H1s ("CUSTOM SCREEN PRINTING." on home, "GET IN TOUCH." on
contact) — uses `display: "block"` instead:

```tsx
const dominique = localFont({
  src: "../public/fonts/Dominique-VF.woff2",
  variable: "--font-dominique",
  display: "block",
  preload: true,
});
```

`font-display: block` tells the browser to hold text **invisible** for a
short "block period" (commonly up to ~3 seconds, browser-dependent) while
the font loads, before falling back to a visible substitute font — as
opposed to `swap`, which shows the fallback immediately. Browsers
typically paint atomically per frame: if an above-the-fold heading using a
`block`-display font is waiting out its block period under a throttled
connection (Lighthouse's default mobile preset simulates ~1.6 Mbps/150ms
RTT — slow enough that a custom woff2 plausibly takes multiple seconds to
arrive), the whole page's first paint can be held back until that period
resolves — which would delay the *other*, faster-loading LCP text element
on the same page too, even though that element's own font uses `swap`.
This lines up closely with the measured ~3.1–4.2s timings on both pages:
both page's above-the-fold layout includes a `font-display`-styled
heading (Home's giant "Custom Screen Printing." hero headline; Contact's
"Get in Touch." H1), and both delays are in the same few-second range as
a typical browser's `block`-period ceiling.

**This is a plausible, well-evidenced hypothesis, not a proven root
cause** — it wasn't confirmed with a network trace or WebPageTest
timeline, and this plan's author (an advisor, not the executor) is not
permitted to run production builds/browsers to verify it directly. That
verification is this plan's actual job — Step 4 measures the fix's real
effect before it's kept.

**The tradeoff to watch**: `display: "block"` was very possibly chosen
*deliberately* for this font specifically — it's the site's distinctive
brand identity typeface, used in giant oversized headlines throughout;
briefly showing NO text (current behavior) can look better than briefly
showing the WRONG-looking fallback font at the wrong size/weight, then
visibly snapping to the real one (`swap`'s behavior) — especially for a
font this prominent. Switching to `swap` trades a paint-delay problem for
a possible visible-reflow-and-CLS problem. This plan's steps measure both
LCP *and* CLS before deciding the fix is a net improvement.

## Current state

`app/layout.tsx` (relevant excerpt, lines 1–27, verified by direct read):

```tsx
import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { siteConfig } from "@/lib/site-config";
import { getSiteInfo } from "@/lib/get-site-info";
import "./globals.css";

const figtreeSans = Figtree({
  variable: "--font-figtree-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const dominique = localFont({
  src: "../public/fonts/Dominique-VF.woff2",
  variable: "--font-dominique",
  display: "block",
  preload: true,
});
```

`app/globals.css:198` (confirms `font-display` the Tailwind utility maps
to this exact font — read-only reference, not modified by this plan):

```css
--font-display: var(--font-dominique);
```

`app/(site)/contact/page.tsx:36-38` (confirms Contact's LCP element — the
`<h1>` Lighthouse identified — uses the `font-display` utility, i.e. the
`dominique` font):

```tsx
        <h1 className="font-display font-black uppercase leading-[0.85] text-[clamp(5rem,18vw,12rem)]">
          Get in Touch<span className="text-gold">.</span>
        </h1>
```

`app/(site)/page.tsx:62-68` (Home's hero headline, also `font-display`,
above the fold and above the intro paragraph Lighthouse flagged as the
actual LCP element):

```tsx
          <h1 className="font-display font-black uppercase leading-[0.75]">
            <span className="block text-[clamp(6rem,15vw,12rem)]">Custom</span>
            <span className="block text-[clamp(6rem,15vw,12rem)]">Screen</span>
            <span className="block text-[clamp(6rem,15vw,12rem)]">
              Printing<span className="text-gold">.</span>
            </span>
          </h1>
```

`Dominique-VF.woff2` is a variable font (the "VF" in the filename) — a
single file covering the full weight range this face is used at, which is
already a size-efficient choice (no per-weight duplicate files to load).

## Commands you will need

| Purpose                     | Command                                                          | Expected on success |
|------------------------------|-------------------------------------------------------------------|----------------------|
| Production build             | `pnpm build`                                                       | exit 0               |
| Start production server      | `pnpm start` (leave running in a separate terminal)                | serves on `http://localhost:3000` |
| Lighthouse (before/after, home) | `npx --yes lighthouse http://localhost:3000/ --output=json --output-path=./lh-home-<label>.json --chrome-flags="--headless" --only-categories=performance` | exit 0 |
| Lighthouse (before/after, contact) | `npx --yes lighthouse http://localhost:3000/contact --output=json --output-path=./lh-contact-<label>.json --chrome-flags="--headless" --only-categories=performance` | exit 0 |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Tests | `pnpm test` | all pass, same count as baseline |
| Lint | `pnpm lint` | exit 0 |

(`<label>` is `before` or `after` — run the same two Lighthouse commands
once against the unmodified code and once against the fixed code, so you
have a real comparison, not just a single post-fix number.)

## Scope

**In scope** (the only file you should modify for the actual fix):
- `app/layout.tsx`

**Files you may create** (measurement artifacts, not permanent):
- Temporary `lh-home-before.json`, `lh-home-after.json`,
  `lh-contact-before.json`, `lh-contact-after.json` — delete these after
  extracting the numbers into your final report (Step 5); do not commit
  them.

**Out of scope** (do NOT touch, even though they look related):
- `figtreeSans` and `geistMono`'s font config — already `display: "swap"`,
  correct, not part of this investigation.
- `app/globals.css`'s `--font-display` mapping — unrelated to the loading
  strategy, just aliases the CSS variable name.
- Any component using the `font-display` Tailwind utility class
  (there are many, sitewide) — this plan changes the *font loading
  config*, not any individual heading's styling.
- Any other Lighthouse finding from plan 037's report (contrast, aria,
  CSP, focus-restore) — each has (or will have) its own plan; don't fix
  them here even if you notice them again during this investigation.

## Git workflow

- Branch: none required, or `advisor/040-lcp-font-display` — LOW-MED risk
  given the visual tradeoff; a branch makes it easy to compare before/after
  screenshots if you want to show the difference to a reviewer.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `perf: switch display font to font-display: swap`.
- Do NOT push unless the operator instructed it.
- **Only commit the fix if Step 4's measurement actually shows an LCP
  improvement without an unacceptable CLS regression** — see "Done
  criteria" and "STOP conditions." This plan's own steps are the
  experiment; a negative result is a valid, useful outcome (report it,
  don't force a commit to "complete" the plan).

## Steps

### Step 1: Establish a "before" baseline

```
pnpm build
pnpm start
```

In a second terminal, with the server running:

```
npx --yes lighthouse http://localhost:3000/ --output=json --output-path=./lh-home-before.json --chrome-flags="--headless" --only-categories=performance
npx --yes lighthouse http://localhost:3000/contact --output=json --output-path=./lh-contact-before.json --chrome-flags="--headless" --only-categories=performance
```

**Verify**: both commands exit 0 and produce their JSON files. Extract and
note (from `.audits["largest-contentful-paint"].numericValue` and
`.audits["cumulative-layout-shift"].numericValue`): LCP and CLS for both
pages, before any change. These should roughly match plan 037's report
(~4.1s home, ~3.2–4.0s contact, CLS 0 on both) — if they're wildly
different, note the discrepancy (machine/network variance) before
proceeding, since your "after" comparison needs a consistent baseline.

### Step 2: Apply the fix

In `app/layout.tsx`, replace:

```tsx
const dominique = localFont({
  src: "../public/fonts/Dominique-VF.woff2",
  variable: "--font-dominique",
  display: "block",
  preload: true,
});
```

with:

```tsx
const dominique = localFont({
  src: "../public/fonts/Dominique-VF.woff2",
  variable: "--font-dominique",
  display: "swap",
  preload: true,
});
```

(Only `display: "block"` → `display: "swap"` changes — matching the same
setting already used by `figtreeSans` and `geistMono` in this same file,
for consistency.)

**Verify**: `grep -n "display:" app/layout.tsx` shows `"swap"` on all
three font configs, no `"block"` remaining.

### Step 3: Rebuild and re-measure

```
pnpm build
pnpm start
```

(restart the server so it serves the updated build)

```
npx --yes lighthouse http://localhost:3000/ --output=json --output-path=./lh-home-after.json --chrome-flags="--headless" --only-categories=performance
npx --yes lighthouse http://localhost:3000/contact --output=json --output-path=./lh-contact-after.json --chrome-flags="--headless" --only-categories=performance
```

**Verify**: both exit 0. Extract the same two numbers (LCP, CLS) as Step 1.

### Step 4: Compare and decide

Compute the before/after delta for LCP and CLS on both pages.

- **If LCP improved meaningfully (e.g. dropped below ~2.5s, or at least
  by more than 1s) AND CLS stayed at or near 0 (no new layout shift from
  the font swap)**: keep the fix. This is the expected/hoped-for outcome
  given the hypothesis in "Why this matters."
- **If LCP improved but CLS got meaningfully worse** (e.g. rose above 0.1,
  the "needs improvement" threshold): this confirms the visible-reflow
  tradeoff predicted above. Do not silently keep or discard the change —
  report both numbers and let a human decide whether the LCP win is worth
  the new CLS cost, or whether `display: "optional"` (never swaps after
  the first paint attempt, avoiding CLS entirely but sometimes shows the
  fallback font permanently on a slow first load) is a better middle
  ground worth trying as a follow-up.
- **If LCP did not meaningfully improve**: the hypothesis in "Why this
  matters" was wrong, or only partially explains the delay. Revert the
  change (`display: "swap"` back to `"block"`), and report the
  measurements plainly — do not guess at a second hypothesis in this same
  plan; a fresh investigation (new render-blocking-resource trace, e.g.
  via Chrome DevTools' Performance panel or Lighthouse's
  `render-blocking-resources` audit specifically) would be a separate,
  follow-up plan.

**Verify**: your final report (Step 5) states clearly which outcome
occurred and what action was taken (kept, reverted, or flagged for human
decision).

### Step 5: Full verification sweep and report

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`.

Write your findings (before/after numbers for both pages, both metrics,
and the decision from Step 4) either as a new section appended to
`docs/prelaunch-audit-2026-09-27.md` (if it still exists and this is a
direct continuation of that work) or as its own short file
`docs/lcp-font-display-investigation-<today's date>.md` — whichever
already exists in the repo at execution time; if neither approach is
obviously right, default to the new dated file.

Delete the four temporary `lh-*-before.json`/`lh-*-after.json` files after
extracting their numbers into the report.

**Verify**: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test` all exit 0
(same test count as baseline — this plan doesn't add tests). The report
file exists and states the before/after numbers and the Step 4 decision
plainly. `git status` shows no leftover `lh-*.json` files.

## Test plan

No new automated tests — this is a font-loading configuration change with
no testable application logic. `pnpm test`/`pnpm build` are the
regression guard (a malformed font config would fail the build). The real
"test" for this plan is the empirical Lighthouse before/after comparison
in Steps 1–4, which is why it's structured as its own multi-step
measurement rather than a single "apply and trust it" change.

**Verify**: `pnpm test` → same pass/fail count as a pre-change baseline.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] A "before" Lighthouse measurement was captured for both `/` and
      `/contact` (LCP + CLS) prior to any code change
- [ ] `app/layout.tsx` was changed to `display: "swap"` for the `dominique`
      font (or reverted back to `"block"`, per Step 4's outcome — see next
      bullet)
- [ ] An "after" Lighthouse measurement was captured for both pages
      post-change
- [ ] A written decision exists (in the report) stating: kept the change,
      reverted it, or flagged it for human decision — with the actual
      before/after numbers backing that decision, not just an assertion
- [ ] If the fix was kept: `grep -n "display:" app/layout.tsx` shows
      `"swap"` on all three fonts. If reverted: shows `"block"` on
      `dominique` again (unchanged from before this plan)
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, same count as baseline
- [ ] `pnpm build` exits 0 (whichever final state — kept or reverted)
- [ ] No leftover `lh-*.json` files in `git status`
- [ ] A report file exists documenting the before/after numbers and decision
- [ ] No files outside `app/layout.tsx` (and the one new report file) are
      modified (`git status`)
- [ ] `plans/README.md` status row updated (reflecting the actual
      outcome — DONE if kept, or DONE with a note if reverted/flagged;
      not silently marked DONE if the fix was reverted)

## STOP conditions

Stop and report back (do not improvise) if:

- `app/layout.tsx` doesn't match the "Current state" excerpt above (drift
  since this plan was written).
- `npx lighthouse` cannot run due to no network access — report this and
  do not attempt the fix blind (without measurement, Step 2's change
  would be an unverified guess, which this plan explicitly wants to
  avoid); recommend a human complete Steps 1–4 with network access
  instead.
- The "before" and "after" LCP numbers vary by more than ~30% between
  repeated runs of the *same* code (i.e. machine noise is large enough to
  swamp the signal you're trying to measure) — run each measurement 2-3
  times and use the median, same approach as plan 037's own noise-check,
  rather than trusting a single noisy run in either direction.
- CLS regresses significantly (above ~0.1) after the fix — per Step 4,
  don't silently keep the change; report both numbers and flag for human
  decision instead.

## Maintenance notes

- If the fix is kept, a reviewer should visually confirm the font-swap
  flash (fallback font briefly visible before Dominique loads) looks
  acceptable on a real slow connection or with DevTools network throttling
  — Lighthouse's CLS number captures *layout* shift but not necessarily
  whether the momentary visual flash reads as "broken" for this
  particular brand-critical typeface.
- If a future plan explores `display: "optional"` as a middle ground (per
  Step 4's guidance for the "LCP improved but CLS worsened" case), it
  should follow the same before/after Lighthouse measurement structure
  this plan established, rather than applying it on assumption.
- This plan only tests the `dominique` local font's `display` value. If
  the actual root cause turns out to be something else entirely (Step 4's
  "hypothesis was wrong" branch), the next investigation should look at
  Lighthouse's `render-blocking-resources` audit output directly and/or a
  Chrome DevTools Performance-panel trace of the initial page load, rather
  than guessing at another single hypothesis.
