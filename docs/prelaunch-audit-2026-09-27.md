# Pre-launch audit: Lighthouse (production build) + screen-reader pass

**Date**: 2026-09-27
**Plan**: [plans/037-prelaunch-lighthouse-and-screenreader-pass.md](../plans/037-prelaunch-lighthouse-and-screenreader-pass.md)
**Build tested**: `pnpm build` output at commit `0dc6441` (production build, `next start`)
**Server**: `next start` on `http://localhost:3002` (port 3000 was occupied by an unrelated project already running on this machine; `PORT=3002` was used instead — this has no effect on the production-build nature of the audit, only the port)

## 1. Lighthouse summary (production build)

Lighthouse CLI defaults to its standard **mobile form factor with simulated
throttling** (150ms RTT, ~1.6 Mbps throughput, 4x CPU slowdown) unless a
`--preset=desktop` flag is passed — this run used the defaults, so all
numbers below reflect simulated-mobile conditions, not raw broadband/desktop
performance. Each page was run twice to check for machine noise; both runs
are reported.

| Page | Run | Performance | Accessibility | Best Practices | SEO | LCP (ms) | CLS | TBT (ms) |
|---|---|---|---|---|---|---|---|---|
| `/` (home) | 1 | 86 | 96 | 100 | 100 | 4163.8 | 0 | 21.0 |
| `/` (home) | 2 | 87 | 96 | 100 | 100 | 4142.3 | 0 | 17.5 |
| `/contact` | 1 | 93 | 96 | 96 | 100 | 3160.1 | 0 | 16.5 |
| `/contact` | 2 | 88 | 96 | 96 | 100 | 3995.7 | 0 | 20.0 |

No dramatic swing (e.g. 95→40) occurred, so this is reported as-is rather
than treated as noise requiring a re-run per the plan's STOP condition —
though the Contact page's two LCP runs (3160ms vs 3996ms) do vary by ~25%,
which is worth knowing if a follow-up plan re-measures.

**Both pages exceed the 2.5s "good" LCP threshold under simulated-mobile
conditions.** See Finding 1 below.

## 2. Manual screen-reader pass — NOT COMPLETED

**STOP condition triggered** (per plan, "You cannot find macOS VoiceOver or
NVDA available in the execution environment... report this limitation
plainly; do not attempt to fake or skip the manual pass").

This plan was executed by an AI coding agent operating through text/tool
calls in a sandboxed environment with no audio output or speech
interpretation capability. macOS VoiceOver may exist on the underlying
machine, but this agent has no way to toggle it, listen to its spoken
announcements, and interpret them — which is what the plan's manual pass
actually requires. This is a genuine capability gap, not a missing
installation, and it cannot be closed by running more automated tools.

**What was done instead** (clearly not a substitute, per the plan's own
instruction, but recorded for whoever picks this up): the quote form and
lightbox were driven with real keyboard events (Tab/Escape) in a real
browser, and the DOM/accessibility-tree state was inspected after each
action — this verifies *behavior* (where focus lands, whether it's trapped,
what ARIA attributes are wired up) but not what a screen reader actually
*announces*, which is the thing the plan is asking a human to confirm.

### 2a. Quote form (`/contact`) — automated proxy results

| # | Check | Method | Result |
|---|---|---|---|
| 1 | All fields present in DOM/tab order (Name, Email, Estimated Quantity, Number of Colors, Garment Type, Timeline, project description, Artwork Files) | DOM inspection | PASS — all present with `tabIndex=0` |
| 2 | Honeypot field (`_hp`) skipped/not meaningfully focusable | DOM inspection | PASS — `tabIndex={-1}`, confirmed in rendered DOM |
| 3 | Each field has a programmatically associated label | DOM inspection (`<label for>` / `.labels`) | PASS — every field resolves a matching label via `element.labels[0]` |
| 4 | Required fields marked for assistive tech, not just visually | DOM inspection | PASS — required fields carry `aria-required="true"` (Name, Email, Estimated Quantity, project description) |
| 5 | Validation errors wired for assistive-tech announcement | DOM inspection after triggering empty-submit | PASS (by construction) — error text nodes have `role="alert"`, and the corresponding input gets `aria-invalid="true"` + `aria-describedby` pointing at the error node's `id`. This is a standard, correct pattern that screen readers do announce automatically. |
| — | **Do these ARIA attributes actually get spoken correctly by VoiceOver/NVDA?** | **Real screen reader** | **NOT TESTED** |

### 2b. Portfolio lightbox (`/portfolio`) — automated proxy results

| # | Check | Method | Result |
|---|---|---|---|
| 1 | Focus moves into the lightbox on open (close button autofocus) | Real keyboard/DOM inspection | PASS — `document.activeElement` is the "Close lightbox" button immediately after open |
| 2 | Tab stays trapped inside the lightbox | Real `Tab` keypresses (7x) + DOM inspection | PASS — focus cycled among the dialog's own focusable elements (Close, Next image) and never left `dialog.contains(activeElement)` |
| 3 | Escape closes the lightbox | Real `Escape` keypress | PASS — dialog removed from DOM after Escape |
| 4 | Focus returns to the gallery thumbnail that opened the lightbox, after closing | Real keypress/click + DOM inspection | **FAIL — see Finding 5** |
| 5 | Lightbox announces itself as a dialog/modal | Browser accessibility-tree read via this session's tooling | **INCONCLUSIVE — see Finding 6** |
| — | **Does a real screen reader actually announce the dialog, labels, and focus changes correctly?** | **Real screen reader** | **NOT TESTED** |

## 3. Findings

### Finding 1 — LCP exceeds 2.5s on both audited pages (simulated mobile)

- **Page**: `/` (home) and `/contact`
- **Expected**: LCP ≤ 2.5s (Core Web Vitals "good" threshold)
- **Actual**: Home ~4.15s (both runs), Contact 3.16s–4.00s (two runs)
- **Detail**: This confirms the external audit's concern that motivated this
  plan, but see Finding 2 — the specific mechanism (large hero image) that
  the original audit assumed does not match what Lighthouse's own LCP
  breakdown reports.

### Finding 2 — The LCP element on both pages is text, not the hero image

- **Page**: `/` (home) and `/contact`
- **Expected** (per the original external audit's framing): the homepage's
  LCP element is the large full-bleed hero photo above the fold.
- **Actual**: Lighthouse's `lcp-breakdown-insight` audit identifies the LCP
  element as:
  - Home: a `<p>` of intro copy ("Antibroadcasting is an artist-run shop in
    Minneapolis...") — selector `section.relative > div.flex > div.flex > p.mt-6`
  - Contact: the `<h1>` ("GET IN TOUCH.") — selector
    `main#main-content > div.w-full > section.pt-10 > h1.font-display`
  - For both, Lighthouse's own timing breakdown shows only ~10–43ms
    time-to-first-byte and ~44–350ms element-render-delay for that specific
    element — i.e. the text itself renders quickly. The remaining ~3–4s of
    the reported LCP time is not attributed to loading/rendering that text
    node in the breakdown table, which suggests the bulk of the delay comes
    from earlier in the critical path (render-blocking CSS/fonts/JS) rather
    than the LCP element's own resource.
- **Why this matters**: a follow-up plan aimed at "optimize the hero image"
  (the original audit's framing) would likely not move this number. A
  follow-up plan should instead investigate render-blocking resources
  (webfont loading, CSS/JS on the critical path) before touching image
  optimization.

### Finding 3 — Color contrast failures (homepage)

- **Page**: `/`
- **Expected**: WCAG AA text contrast ≥ 4.5:1
- **Actual**: 3 elements fail:
  1. Header/nav "Get a Quote"-style link — contrast 2.26 (`#f7f1e9` on
     `#de9300`, bold 12px) — selector
     `div.w-full > section.relative > div.flex > a.flex`
  2. Footer eyebrow label — contrast 3.41 (`#676360` on `#080504`, 12px) —
     selector `section.bg-bg-inverse > div.w-full > div.flex > span.font-mono`
  3. A second instance of the same style — selector
     `div.w-full > div.mb-16 > div.flex > p.font-mono`
  - Both #2/#3 look like the same design token (`text-text-inverse/40`
    opacity-based color) used in more than one place — likely a single
    token fix resolves both.

### Finding 4 — `label-content-name-mismatch` on several buttons/links (home + contact)

- **Pages**: `/` and `/contact`
- **Expected**: an element's accessible name should include its visible
  text content (WCAG 2.5.3, relevant to speech-input users and some screen
  reader navigation modes).
- **Actual**: Lighthouse flags:
  - Gallery "View Client X" buttons on the homepage (e.g. `aria-label="View
    Client Five"` on a button whose visible text is different/absent) —
    3 instances on home, sampled from the featured-work grid.
  - The "Open ... in Google Maps" address links on both home and contact —
    `aria-label` fully replaces rather than supplements the visible address
    text.
- **Fix direction** (for a future plan, not applied here): where an
  `aria-label` is used to add context (e.g. "opens in new tab"), prefer
  `aria-describedby` for the added context so the visible text remains part
  of the accessible name, or ensure the `aria-label` string is a superset
  that still contains the visible text verbatim.

### Finding 5 — Contact page: link relies on color alone, insufficient contrast

- **Page**: `/contact`
- **Element**: the "art requirements" link inside the quote form's helper
  text — selector `form.space-y-6 > div > p.mt-1.5 > a.text-text-accent`,
  href `/how-it-works#art-requirements`
- **Expected**: an inline link should be distinguishable from surrounding
  text by more than color alone, and meet 3:1 contrast against adjacent text.
- **Actual**: contrast of 2.18:1 against surrounding text (`#833e00` link
  vs `#201916` body text), and no underline or other non-color
  distinguishing style.

### Finding 6 — Contact page: a Content Security Policy issue is logged in Chrome's Issues panel

- **Page**: `/contact`
- **Detail**: Lighthouse's `inspector-issues` best-practices audit reports
  one issue of type "Content security policy" logged in the DevTools Issues
  panel while loading `/contact`. Lighthouse's JSON output does not include
  further detail (`subItems.items` was empty in this run) — reproducing
  this by opening `/contact` in Chrome DevTools directly and reading the
  Issues panel is needed to get the specific directive/blocked resource
  before this can be turned into an actionable fix plan.

### Finding 7 — Lightbox: focus does not return to the triggering thumbnail after close (confirmed, reproducible)

- **Files**: [components/ui/Lightbox.tsx:49-56](../components/ui/Lightbox.tsx#L49-L56),
  [lib/hooks/useLightboxGallery.ts:14-17](../lib/hooks/useLightboxGallery.ts#L14-L17)
- **Expected** (per the plan and the code's own intent — `onRestoreFocus`
  callback): after closing the lightbox, keyboard focus should land back on
  the gallery thumbnail button that opened it.
- **Actual**: focus lands on `<body>` instead, both when closing via
  Escape and when closing via the visible "Close lightbox" button.
  Reproduced twice.
- **Root cause (hypothesis, not fixed here per plan scope)**:
  `handleClose()` in `Lightbox.tsx` calls `onRestoreFocus()` (which calls
  `triggerRefs.current[activeIndex]?.focus()` in `useLightboxGallery.ts`)
  **immediately**, then only calls `dialogRef.current?.close()` 200ms later
  (after a fade-out animation). At the moment `onRestoreFocus()` runs, the
  native `<dialog>` is still open via `showModal()`, which means the
  browser is still enforcing its own modal focus scope — focus is not
  permitted to move to an element outside the still-open dialog, so the
  `.focus()` call on the thumbnail is silently blocked/reverted, and focus
  falls back to `<body>`. By the time `dialog.close()` actually runs 200ms
  later, focus is no longer inside the dialog, so the browser's own
  built-in "restore focus to the previously-focused element" behavior
  (which native `<dialog>.close()` provides, but only if focus is still
  inside the dialog at close time) doesn't fire either. Both restore paths
  miss.
- **Likely fix direction** (for a future plan): call `onRestoreFocus()`
  *after* `dialogRef.current.close()` inside the existing `setTimeout`
  callback, not before it — i.e. swap the order of the two lines in
  `handleClose`.
- **Why this is a real, user-facing issue**: a keyboard or screen-reader
  user who opens an image, then closes it, loses their place in the page —
  focus resets to `<body>`, meaning the next Tab press starts from the top
  of the document instead of continuing from the gallery item they were
  just looking at.

### Finding 8 (informative, unconfirmed) — Lightbox's accessible role read as "generic" by this session's browser tooling, not "dialog"

- **Detail**: this session's browser-automation tool's own accessibility
  tree reported the lightbox container as `generic "Client Five —
  lightbox"` rather than as a `dialog` role, despite the element being a
  native `<dialog>` opened with `showModal()` (which should expose an
  implicit `dialog` role per the HTML spec).
- **Confidence**: LOW. This may reflect a simplification in this session's
  own accessibility-tree extraction rather than a genuine browser/DOM
  issue — it was not cross-checked against Chrome DevTools' actual
  Accessibility panel or a real screen reader. Flagging it so the human
  screen-reader pass specifically confirms whether VoiceOver/NVDA announces
  "dialog" on entering the lightbox; if it does, this finding can be
  discarded as a tooling artifact.

## 4. What still needs a human

- The real screen-reader pass (Section 2) — VoiceOver or NVDA, walking
  through both the quote form and the lightbox exactly as Steps 4–5 of the
  plan describe, since no assistive-technology output could be interpreted
  by this execution environment.
- Confirming or discarding Finding 8 (dialog role) using Chrome DevTools'
  Accessibility panel or the actual screen-reader pass.
- Re-checking Finding 6 (CSP issue) with actual Chrome DevTools' Issues
  panel in a clean/incognito profile — Plan 042 (Section 5) could not
  reproduce it via console/network inspection alone.

## 5. Plan 042 addendum — CSP investigation on `/contact` (2026-09-27)

Plan 042 was run as a direct follow-up to Finding 6 above, to reproduce the
CSP issue in a real browser and identify the specific blocked
directive/resource. **Outcome: could not reproduce.**

- **Step 1 — Turnstile check**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset in
  this execution environment (no value in the shell env, no `.env.local`).
  Per `components/ui/QuoteForm.tsx:57,176-182`, the Turnstile `<Script>` and
  widget are both gated behind `siteKey` being truthy — with it unset,
  Turnstile does not render at all on `/contact` here, so it cannot be the
  cause of anything observed in this environment. If the original Lighthouse
  run (Finding 6) used the same convention (this repo's established pattern
  of leaving optional-integration env vars unset locally), Turnstile can be
  ruled out as the cause of that run's issue too.
- **Step 2 — Reproduction attempt**: ran `pnpm build && pnpm start` (clean
  `.next` rebuild) and loaded `/contact` in a real Chromium-based browser.
  Checked `read_console_messages` (CSP violations surface there as console
  errors in Chromium, in addition to the dedicated Issues panel) and
  `read_network_requests` after full load plus a several-second wait (to
  cover `strategy="lazyOnload"` timing). Result: **zero console errors,
  zero third-party network requests** — the page made no requests to any
  origin outside `localhost:3000`. Did not proceed to the form-submission
  fallback step: `QuoteForm`'s `handleSubmit` calls `e.preventDefault()` and
  uses `fetch("/api/send")` (no native `<form action>`), so submission can
  only ever exercise `connect-src 'self'` (already allowed) and never
  `form-action` — code inspection confirms submitting would add no new CSP
  surface, so it wasn't run (avoids sending a real test email through the
  live Resend-backed send pipeline for no diagnostic gain).
- **Additional check on the Turnstile lead**: rather than stopping at "it
  didn't render here," checked whether Turnstile *could* have been the
  cause if it had been enabled. All of Turnstile's known request origins
  (`https://challenges.cloudflare.com` for the widget script, the
  challenge iframe, and its own XHR calls) are already explicitly present
  in `script-src`, `frame-src`, and `connect-src` in the current CSP — so
  even a fully-rendered Turnstile widget would not be expected to trigger a
  CSP violation against this header. (A live re-render test using
  Cloudflare's public "always passes" test site key, `1x00000000000000000000AA`
  — a published test value, not a credential — was attempted but hit an
  unrelated `next start` artifact in this sandbox: the dev/prod server
  intermittently served a stale pre-rebuild bundle from a lingering worker
  process rather than the freshly-built one, making that specific test
  inconclusive. Given the static CSP analysis above already covers
  Turnstile's known origins, this wasn't pursued further as it isn't
  necessary to answer the plan's question.)
- **Conclusion**: no CSP violation reproduces on `/contact` at commit
  `0dc6441` in this environment, with a plain load or expected async
  script timing. This matches the plan's outcome (c) — issue could not be
  reproduced. Likely explanations: a transient/environment-specific
  condition in the original Lighthouse run (e.g. a browser extension in
  that run's profile injecting a script, which is common false-positive
  noise for strict CSPs and matches the plan's own noted risk), or an
  artifact of that specific headless Lighthouse pass rather than a real,
  persistent issue in this app's own code.
- **No `next.config.ts` change was made** — per the plan's explicit
  instruction not to guess-fix the CSP header without confirming what's
  blocked, and because nothing reproduced to fix.
- **Browser/tooling used**: Claude's built-in Chromium-based browser pane,
  driven via its console/network inspection tools (`read_console_messages`,
  `read_network_requests`); no dedicated Chrome DevTools "Issues" panel
  access was available in this environment beyond what surfaces in the
  console, which is the documented limitation carried into the note below.
- **Recommendation for a human**: re-run this check with actual Chrome
  DevTools' Issues panel open (not just console) in a clean/incognito
  profile, since that panel can occasionally surface CSP report-only or
  edge-case violations that don't always mirror to the console, and a
  clean profile rules out extension noise definitively. If it reproduces
  there, the exact blocked directive/URL from that panel should drive a
  new, narrowly-scoped fix plan.

## 6. Recommended follow-up plans

Per this plan's "Maintenance notes," each of these should become its own
numbered plan rather than being fixed inline:

1. Investigate render-blocking critical path (fonts/CSS/JS) driving LCP
   past 2.5s on `/` and `/contact` — **not** hero-image optimization
   (Findings 1–2).
2. Fix lightbox focus-restore-after-close bug — swap call order in
   `Lightbox.tsx`'s `handleClose` (Finding 7).
3. Fix the three color-contrast failures on the homepage (Finding 3).
4. Fix `label-content-name-mismatch` on gallery buttons and map links
   (Finding 4).
5. Fix the low-contrast, color-only "art requirements" link on the contact
   form (Finding 5).
6. ~~Investigate the CSP issue on `/contact` (Finding 6).~~ Done via Plan
   042 (Section 5) — could not reproduce; a human should re-check with
   DevTools' Issues panel in a clean profile before this is fully closed
   out.
7. Complete the human screen-reader pass this plan could not perform
   (Section 2/4), and resolve Finding 8.
