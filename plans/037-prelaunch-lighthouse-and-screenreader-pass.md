# Plan 037: Pre-launch production Lighthouse pass + manual screen-reader check

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. This plan produces a **report**, not a code
> change — its "done criteria" are about the report existing and being
> complete, not about every metric passing a bar. When done, update the
> status row for this plan in `plans/README.md` — unless a reviewer
> dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: none needed — this plan doesn't depend on
> specific source line numbers; it runs against whatever the current build
> produces.

## Status

- **Priority**: P2
- **Effort**: S (a few hours, mostly wall-clock waiting on build/audit tools)
- **Risk**: LOW (read-only measurement; no source changes unless a
  follow-up plan is written from what it finds)
- **Depends on**: none (independent of plans 034–036, but running it
  *after* 034 lands is slightly more useful, since 034 changes the
  Contact/Privacy/Terms layout this plan will measure — not a hard
  dependency)
- **Category**: tests (verification)
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

An external site audit (2026-09-27) explicitly scoped itself to the local
dev server ("representative for layout/responsiveness but not for
real-world load performance — dev builds are unminified and unbundled
differently than production") and recommended, before launch: (1) a
Lighthouse pass against a **production build**, particularly LCP on the
homepage hero (a large full-bleed photo above the fold), and (2) a manual
screen-reader pass (VoiceOver/NVDA) specifically on the quote form and the
portfolio lightbox.

On the lightbox specifically: this plan's author read
`components/ui/Lightbox.tsx` directly and confirmed it's built on the
native `<dialog>` element with `.showModal()`
(`components/ui/Lightbox.tsx:30,44`) rather than a hand-rolled modal —
native `<dialog>` + `showModal()` gives focus-trapping and modal semantics
for free from the browser, which is the *correct* pattern and likely why
the audit's own assessment was "worth confirming," not "this is broken."
This plan exists to actually confirm that with a real screen reader rather
than leave it as an assumption either way.

No specific bug is presumed here — this plan's job is to produce the
missing verification artifact the audit called out, and to surface
concrete follow-up findings (each of which becomes its own plan) if either
the Lighthouse numbers or the manual pass reveal something.

## Current state

- `package.json` scripts (verified): `"build": "next build"`,
  `"start": "next start"`, `"dev": "next dev"`. No `lighthouse`,
  `playwright`, `axe`, or similar testing/audit tool is currently a
  dependency anywhere in `package.json` — confirmed via
  `grep -n "lighthouse\|playwright\|axe" package.json` (no matches). This
  plan introduces no new permanent dependency; it uses `npx` for a
  one-off Lighthouse CLI run (ephemeral, not added to `package.json`).
- Next.js dev server defaults to port 3000; `next start` (production mode)
  also defaults to port 3000 unless a `PORT` env var or `-p` flag is
  given.
- Pages to audit, per the original finding: `/` (homepage — has the LCP
  hero image), `/contact` (quote form). The lightbox lives on
  `/portfolio` — open any gallery item to trigger it.
- `components/ui/QuoteForm.tsx` and `components/ui/Lightbox.tsx` are the
  two components the audit specifically flagged for the manual pass —
  confirmed to exist at those paths.

## Commands you will need

| Purpose                     | Command                                                          | Expected on success |
|------------------------------|-------------------------------------------------------------------|----------------------|
| Production build             | `pnpm build`                                                      | exit 0               |
| Start production server      | `pnpm start` (run in background/another terminal — leave running) | serves on `http://localhost:3000` |
| Lighthouse (homepage)         | `npx --yes lighthouse http://localhost:3000/ --output=json --output-path=./lighthouse-home.json --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo` | exit 0, writes `lighthouse-home.json` |
| Lighthouse (contact page)     | `npx --yes lighthouse http://localhost:3000/contact --output=json --output-path=./lighthouse-contact.json --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo` | exit 0, writes `lighthouse-contact.json` |
| Stop production server        | (Ctrl-C or kill the `pnpm start` process once both audits finish) | — |

## Suggested executor toolkit

- If your environment has a native browser-automation tool (e.g. a
  Chrome DevTools MCP tool, or Playwright) rather than shell access to
  `npx`, use that to run Lighthouse/accessibility audits instead — the
  goal is the same four Core Web Vitals + accessibility score numbers,
  the tool used to get them is flexible.
- For the manual screen-reader pass, macOS VoiceOver (Cmd+F5 to toggle)
  is assumed available since this is a Mac-based project; if running on
  Windows/Linux, use NVDA instead and note the substitution in the report.

## Scope

**In scope** (files you should create):
- `docs/prelaunch-audit-2026-09-27.md` — the report this plan produces
  (exact filename; use today's actual date if you run this plan later
  than the "Planned at" date above, formatted `YYYY-MM-DD`).

**Out of scope** (do NOT do as part of this plan):
- Fixing anything the audit finds. If Lighthouse or the manual pass turns
  up a real issue (e.g. LCP over 2.5s, a missing accessible name, a focus
  trap failure), **record it in the report with full detail and STOP** —
  do not attempt an on-the-spot fix. A fix based on this plan's findings
  should go through its own plan (see "Maintenance notes"), so it gets
  the same "Current state" grounding and verification gates as every
  other plan in this repo.
- Installing `lighthouse`, `playwright`, `axe-core`, or any other tool as
  a permanent `package.json` dependency — use `npx --yes <tool>` for a
  one-off run only.
- Committing `lighthouse-home.json` / `lighthouse-contact.json` (the raw
  Lighthouse output files) — these are large, semi-random (timing noise),
  and not useful as tracked repo content. Delete them after extracting the
  numbers into the report, or add them to `.gitignore` if you want to keep
  them locally.

## Git workflow

- Branch: none required.
- Commit message style: conventional-commit-ish — e.g.
  `docs: add pre-launch Lighthouse and screen-reader audit report`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Build and start the production server

```
pnpm build
pnpm start
```

Leave `pnpm start` running in the background/a separate terminal for the
remainder of this plan.

**Verify**: `pnpm build` exits 0. `curl -sI http://localhost:3000/` (in a
second terminal) returns `HTTP/1.1 200 OK` (or similar 2xx).

### Step 2: Run Lighthouse against the homepage and Contact page

```
npx --yes lighthouse http://localhost:3000/ --output=json --output-path=./lighthouse-home.json --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo
npx --yes lighthouse http://localhost:3000/contact --output=json --output-path=./lighthouse-contact.json --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo
```

**Verify**: both commands exit 0 and produce their respective `.json`
files. If `npx` cannot reach the npm registry (no network access in this
environment), see "STOP conditions" — do not skip this step silently.

### Step 3: Extract the key numbers

From `lighthouse-home.json`, record (path: `.categories.*.score` and
`.audits["largest-contentful-paint"].numericValue`,
`.audits["cumulative-layout-shift"].numericValue`,
`.audits["total-blocking-time"].numericValue`):

- Performance score (0–100)
- Accessibility score (0–100)
- LCP (ms) — this is the specific metric the audit called out, since the
  homepage hero is a large full-bleed image above the fold
- CLS
- TBT

Repeat for `lighthouse-contact.json` (Performance + Accessibility scores
at minimum; LCP/CLS/TBT if notably different from the homepage).

**Verify**: you have a concrete number for each metric above, not "N/A" —
if Lighthouse failed to measure one (rare, but possible under headless
Chrome quirks), re-run once before reporting a gap.

### Step 4: Manual screen-reader pass on the quote form

Using VoiceOver (macOS: Cmd+F5) or NVDA:

1. Navigate to `/contact` with the screen reader active.
2. Tab through every field in the quote form
   (`components/ui/QuoteForm.tsx`): Name, Email, Estimated Quantity,
   Number of Colors, Garment Type, Timeline, "Tell us about your
   project", Artwork Files upload, and the honeypot field (should be
   skipped/not announced meaningfully — it's `tabIndex={-1}`, verify the
   screen reader doesn't focus it).
3. Confirm each field's label is announced correctly when focused.
4. Confirm the required-field indication is announced (not just visual).
5. Trigger a validation error (e.g. submit with an empty required field)
   and confirm the error is announced to the screen reader, not just
   shown visually.
6. Record pass/fail for each of the above in the report.

### Step 5: Manual screen-reader pass on the portfolio lightbox

1. Navigate to `/portfolio` with the screen reader active.
2. Open any gallery item to trigger the lightbox
   (`components/ui/Lightbox.tsx`).
3. Confirm focus moves into the lightbox (the close button, per
   `components/ui/Lightbox.tsx:102-107`'s comment, is meant to auto-focus
   on open).
4. Tab repeatedly and confirm focus **stays trapped inside the lightbox**
   (does not reach the page content behind it) — this should work for
   free via the native `<dialog>` + `showModal()` pattern, but confirm it
   actually does in practice with your specific browser/OS combination.
5. Confirm Escape closes the lightbox (per
   `components/ui/Lightbox.tsx:58-76`'s keydown handler).
6. Confirm focus returns to the gallery thumbnail that opened the lightbox
   after closing (the `onRestoreFocus` callback,
   `components/ui/Lightbox.tsx:49-56`).
7. Confirm the lightbox announces itself as a dialog/modal to the screen
   reader (via the native `<dialog>` element's implicit role — no
   explicit `role="dialog"` should be needed, but verify this is actually
   announced, not just assumed).
8. Record pass/fail for each of the above in the report.

### Step 6: Write the report

Create `docs/prelaunch-audit-2026-09-27.md` with:

- A summary table of the Lighthouse scores/metrics from Step 3 (homepage
  and Contact page).
- A pass/fail table for each manual check from Steps 4 and 5, with a
  one-line note on any failure.
- A "Findings" section listing anything that failed or scored below a
  reasonable bar (Performance/Accessibility < 90, LCP > 2.5s, CLS > 0.1,
  any manual-check failure) as a discrete, numbered item with enough
  detail (page, element, expected vs. actual) that a future plan could be
  written from it directly.
- If everything passes cleanly: say so plainly. Don't manufacture findings
  to fill the section.

**Verify**: `test -f docs/prelaunch-audit-2026-09-27.md` and the file is
non-empty (`wc -l docs/prelaunch-audit-2026-09-27.md` reports > 0 lines).

### Step 7: Clean up

Stop the `pnpm start` process. Delete (or gitignore, your choice)
`lighthouse-home.json` and `lighthouse-contact.json` — their numbers are
already captured in the report; the raw files aren't meant to be tracked.

**Verify**: `git status` shows no untracked `lighthouse-*.json` files (if
deleted) or shows them listed under `.gitignore`'s effect (if gitignored
instead).

## Test plan

Not applicable in the usual sense — this plan's output *is* a test/audit
report, not application code. There is nothing to unit-test. The
"verification" for each step is the step's own command output and the
report's completeness (Step 6's done criteria).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm build` and `pnpm start` both succeeded during this run
- [ ] Both Lighthouse JSON outputs were produced at some point during the
      run (even if deleted afterward per Step 7 — captured into the
      report first)
- [ ] `docs/prelaunch-audit-2026-09-27.md` exists, is non-empty, and
      contains: a Lighthouse metrics table, a manual-check pass/fail
      table covering all items listed in Steps 4 and 5, and a Findings
      section (populated or explicitly "none found")
- [ ] No `lighthouse-*.json` files left untracked in `git status` (either
      deleted or gitignored)
- [ ] No source code files were modified as part of this plan (`git
      status` — only `docs/prelaunch-audit-2026-09-27.md` and possibly
      `.gitignore` should be new/changed)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `npx lighthouse` cannot install/run because the executor's environment
  has no network access to the npm registry. In that case, report this
  limitation explicitly in the report file instead of skipping the
  Lighthouse section silently, and note that a human with a normal
  internet connection (or the Chrome DevTools Lighthouse panel manually)
  needs to complete Steps 2–3.
- The manual screen-reader pass finds the lightbox's focus trap does
  **not** hold (focus escapes to the page behind it) — this contradicts
  the expected native-`<dialog>` behavior and needs to be reported with
  exact repro steps (browser, OS, screen reader used) rather than
  "fixed" ad hoc; it may indicate a browser-specific `<dialog>` quirk
  worth its own plan.
- Any Lighthouse score comes back dramatically different between two
  consecutive runs on the same page (e.g. Performance swinging from 95 to
  40) — this usually indicates local machine noise (other processes
  competing for CPU during the headless Chrome run) rather than a real
  regression; re-run 2–3 times and report the median, noting the
  variance, rather than reporting a single noisy number as fact.
- You cannot find macOS VoiceOver or NVDA available in the execution
  environment at all (e.g. a headless CI runner with no screen reader) —
  report this limitation plainly; do not attempt to fake or skip the
  manual pass by only doing the automated Lighthouse accessibility score,
  which is a different (and much shallower) check than a real
  screen-reader walkthrough.

## Maintenance notes

- Any concrete finding in the report's "Findings" section should be
  turned into its own numbered plan (038, 039, ...) following this
  repo's existing `plans/` convention, rather than fixed inline here —
  keeps each fix's "Current state" and verification gates properly
  scoped and reviewable independently.
- This audit should be re-run any time a major dependency bump touches
  `next`, `react`, or image-handling libraries (`sharp`), or after the
  portfolio's real photography replaces the current placeholder content
  (new, larger images could meaningfully shift the homepage/portfolio LCP
  numbers).
- The report's date-stamped filename (`prelaunch-audit-2026-09-27.md`) is
  intentional — this is meant to be a point-in-time snapshot, not a
  living document; a re-run later creates a new dated file rather than
  overwriting this one, so the history of prior audits stays intact.
