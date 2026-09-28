# LCP investigation: `dominique` font `display: "block"` → `"swap"` (2026-09-27)

**Plan**: [plans/040-investigate-lcp-display-font.md](../plans/040-investigate-lcp-display-font.md)
**Outcome**: **Reverted.** The hypothesis was not confirmed — no meaningful LCP
improvement on either page. `app/layout.tsx` is unchanged from before this
investigation (`dominique` still uses `display: "block"`).

## Background

Plan 037's production Lighthouse pass found LCP on `/` (~4.15s) and
`/contact` (~3.2–4.0s) well above the 2.5s "good" threshold under
Lighthouse's default simulated-mobile throttling, with the LCP element
itself rendering quickly once available — implying the delay happens
earlier in the critical path. Plan 040 hypothesized that the site's
brand display font (`dominique`, used via the `font-display` Tailwind
utility on every major above-the-fold heading) using `display: "block"`
could be holding back first paint for the whole page while its woff2
loads under throttling, even though the actual LCP text elements use a
different, `swap`-based font.

## Method

Production build (`pnpm build` / `pnpm start`), two Lighthouse runs per
page per state (`--only-categories=performance`, default headless mobile
throttling), on `/` and `/contact`, before and after changing
`dominique`'s `display` from `"block"` to `"swap"` in `app/layout.tsx`.

## Results

All values are `largest-contentful-paint.numericValue` (ms) and
`cumulative-layout-shift.numericValue` from the Lighthouse JSON output.

| Page | State | Run 1 LCP | Run 2 LCP | Avg LCP | CLS |
|---|---|---|---|---|---|
| `/` | before (`block`) | 3699.7 | 4144.2 | 3922 | 0 / 0 |
| `/` | after (`swap`) | 4031.6 | 3991.6 | 4012 | 0 / 0 |
| `/contact` | before (`block`) | 4070.9 | 4067.2 | 4069 | 0 / 0 |
| `/contact` | after (`swap`) | 3158.0 | 4062.8 | 3610 | 0 / 0 |

**Home (`/`)**: LCP delta = **+90ms** (slightly worse, within run-to-run
noise — before-run variance alone was 445ms).

**Contact (`/contact`)**: LCP delta = **-459ms** (nominal improvement),
but the two "after" runs themselves varied by 905ms (3158 vs 4063ms) —
more than double the size of the average improvement being measured, so
this delta is not distinguishable from measurement noise on this
machine.

CLS was 0 in every run, before and after — no layout-shift regression
from the font-display change (moot here since the change was reverted,
but confirms the "tradeoff" concern in the plan's "Why this matters"
section did not materialize either way).

## Decision (Step 4 of the plan)

Neither page showed an LCP improvement that clears the plan's bar for
"meaningful" (a drop below ~2.5s, or an improvement of more than ~1s).
Home got marginally worse; Contact's apparent improvement is smaller than
its own measurement noise. Per the plan's explicit instruction for this
outcome: **the change was reverted** (`dominique` back to
`display: "block"`), and this report is filed instead of a fresh
hypothesis.

`app/layout.tsx` is confirmed unchanged from its pre-investigation state
(`git diff` against the plan's baseline commit `0dc6441` shows no diff on
this file).

## Follow-up

The plan's own "Why this matters" section was a plausible, well-reasoned
hypothesis based on `font-display: block`'s known blocking behavior, but
it does not explain the measured multi-second LCP on either page. Per the
plan's maintenance notes, the next investigation should look at
Lighthouse's `render-blocking-resources` audit output directly and/or a
Chrome DevTools Performance-panel trace of the initial page load, rather
than guessing at another single hypothesis in this same plan.
