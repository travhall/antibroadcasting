# Plan 042: Reproduce and diagnose the Content-Security-Policy issue on /contact

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. **This plan is an investigation, not a known
> fix** — its job is to identify the specific blocked directive/resource so
> a real fix can be scoped in a follow-up plan. Do not guess-fix the CSP
> header without first confirming what's actually being blocked. When
> done, update the status row for this plan in `plans/README.md` — unless a
> reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0dc6441..HEAD -- next.config.ts`
> If it changed since this plan was written, compare the "Current state"
> excerpt below against the live file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (investigation only; any resulting fix would be scoped
  separately once the actual issue is known)
- **Depends on**: none
- **Category**: bug (security/investigation)
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

Plan 037's production Lighthouse pass (2026-09-27) reported that
Lighthouse's `inspector-issues` best-practices audit found one issue of
type "Content security policy" logged in Chrome DevTools' Issues panel
while loading `/contact` — but Lighthouse's JSON output didn't include
enough detail (`subItems.items` was empty in that run) to identify the
specific blocked directive or resource. This plan's job is to reproduce it
directly in Chrome DevTools, where the Issues panel shows the actual
blocked URL and violated directive, and use that to either fix the CSP
header (if trivial and clearly safe) or scope a proper follow-up plan (if
the fix has real tradeoffs, e.g. loosening a directive).

**This plan's author looked for likely causes ahead of time and found one
promising lead that should be checked FIRST, but with an important
caveat** — see "Current state" below. Do not assume the lead is correct;
confirm it.

## Current state

`next.config.ts`'s full CSP header (verified by direct read):

```ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://avatars.githubusercontent.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://challenges.cloudflare.com https://api.github.com https://raw.githubusercontent.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self' https://github.com",
    ].join("; "),
  },
];
```

**Promising lead, unconfirmed**: `/contact` is the only page that
conditionally loads the Cloudflare Turnstile widget script
(`components/ui/QuoteForm.tsx:176-182`):

```tsx
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={renderTurnstile}
        />
      )}
```

— gated behind `siteKey` (from `NEXT_PUBLIC_TURNSTILE_SITE_KEY`). The CSP
already explicitly allows `https://challenges.cloudflare.com` in both
`script-src` and `frame-src`, so a straightforward Turnstile load
shouldn't be blocked. **However**: per this repo's own established
convention (documented in multiple places, e.g. plan 037's context, the
project's memory notes on env vars), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is
often **unset** in local `.env.local` files (it "no-ops when unset," same
pattern as this repo's other optional integrations) — if it was unset
during plan 037's test run, `siteKey` would be falsy and the Turnstile
`<Script>` wouldn't render at all, meaning Turnstile **cannot** be the
cause of what was observed in that specific run. **Step 1 of this plan
checks this directly before chasing the Turnstile lead any further** —
don't assume it's the cause just because it's the only contact-specific
script.

Other CSP-relevant resources loaded on `/contact` (for reference, not
necessarily the cause): Google Fonts are self-hosted via `next/font` (see
plan 040's investigation — no runtime request to `fonts.googleapis.com`
from the public site), so the `style-src ... https://fonts.googleapis.com`
allowance is there for Keystatic's admin UI specifically (per
`next.config.ts:3`'s own comment), not the public Contact page.

## Commands you will need

| Purpose                | Command                  | Expected on success |
|-------------------------|---------------------------|---------------------|
| Production build        | `pnpm build`               | exit 0               |
| Start production server | `pnpm start`                | serves on `http://localhost:3000` |
| Typecheck (if a fix is made) | `pnpm exec tsc --noEmit` | exit 0 |
| Tests (if a fix is made)     | `pnpm test`              | all pass, same count as baseline |
| Build (if a fix is made)     | `pnpm build`             | exit 0 |

## Suggested executor toolkit

- This investigation needs a real Chrome (or Chromium-based) browser with
  DevTools' Issues panel — a headless Lighthouse JSON run alone (as plan
  037 already tried) does not surface enough detail. If your environment
  has a browser-automation tool (Chrome DevTools MCP, Playwright, etc.),
  use it to open DevTools' Issues panel or read
  `chrome.devtools.protocol`-level `Network.requestWillBeSentExtraInfo` /
  `Audits.issueAdded` events instead of a plain screenshot, since the
  Issues panel's detail (blocked directive, blocked URL) is what this
  plan actually needs.

## Scope

**In scope** (files you should create):
- A short findings write-up — append a new section to
  `docs/prelaunch-audit-2026-09-27.md` if it still exists (this is a
  direct continuation of that report), otherwise create
  `docs/csp-contact-investigation-<today's date>.md`.

**In scope, conditionally** (only if Step 3 finds a clear, low-risk fix):
- `next.config.ts` — only the specific CSP directive value needed to
  resolve the confirmed issue; do not preemptively loosen any other
  directive "while you're in there."

**Out of scope**:
- Any speculative CSP change made before Step 2 actually confirms what's
  blocked. This plan explicitly forbids guess-fixing the header.
- Rewriting or restructuring the CSP header's overall approach (e.g.
  switching to nonce-based `script-src`) — that's a much larger project,
  noted as already-considered-and-rejected scope in `plans/README.md`'s
  "Full audit batch (2026-09-04)" section ("`script-src`
  `'unsafe-inline'`... changing it is a much larger CSP-nonce project than
  this audit's scope" — same reasoning applies here).

## Git workflow

- Branch: none required for the investigation itself. If Step 3 results
  in a code change, commit it separately with a message like
  `fix: allow <resource> in CSP <directive> for /contact` — be specific
  about what was added and why, not a generic "fix CSP" message.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Confirm whether Turnstile actually loaded during the original test

Check whether `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in your execution
environment: `echo $NEXT_PUBLIC_TURNSTILE_SITE_KEY` or check `.env.local`
for a non-empty value.

**Verify**: state plainly whether the Turnstile widget would have rendered
during a `pnpm build && pnpm start` run in this environment (i.e., whether
`siteKey` in `QuoteForm.tsx` would be truthy). This determines whether
Step 2 should focus on Turnstile or look elsewhere first.

### Step 2: Reproduce the issue in a real browser

```
pnpm build
pnpm start
```

Open `http://localhost:3000/contact` in Chrome (or a Chromium-based
browser/automation tool), open DevTools, and check the **Issues** tab
specifically (not just the Console — CSP violations often show there but
sometimes only surface in the dedicated Issues panel with full detail).

**Verify**: either (a) you see one or more CSP-related issues and can read
the exact blocked directive and blocked URL/resource from the panel's
detail view, or (b) you see nothing (the issue may not reproduce in your
specific browser/environment — see "STOP conditions").

If nothing shows up in a plain page load, also try:
- Submitting the quote form (in case a CSP violation only fires on
  form-action or a fetch/XHR triggered by submission).
- Waiting a few seconds after load (Turnstile, if it renders, loads
  asynchronously via `strategy="lazyOnload"`).

### Step 3: Diagnose and decide

Based on what Step 2 found:

- **If the blocked resource IS Turnstile-related** (e.g. a
  `challenges.cloudflare.com` sub-resource not covered by the current
  `frame-src`/`script-src`/`connect-src` entries, such as a different
  Cloudflare hostname used internally by the widget): note the exact
  directive and URL, and propose the minimal CSP addition needed (e.g.
  adding a specific missing `connect-src` entry). Apply it, following the
  existing header's style (one directive value string per array entry,
  space-separated origins).
- **If the blocked resource is something else entirely** (e.g. a browser
  extension injecting a script, a source-map request, an analytics/error
  tool not yet accounted for in the CSP): document exactly what it is.
  If it's a real, first-party resource this site legitimately needs,
  propose and apply the minimal fix the same way. If it looks like
  browser-extension noise or something outside this app's own control
  (common with ad blockers, password managers, etc. injecting scripts
  that trip a strict CSP), report this explicitly as a likely false
  positive and do NOT modify the CSP header to accommodate it — a
  reviewer should confirm this doesn't reproduce in a clean browser
  profile before ruling it out entirely.
- **If you cannot get any CSP issue to reproduce at all**: report this
  plainly (browser/version used, steps tried) — this may mean the
  original Lighthouse run encountered a transient or environment-specific
  issue that no longer reproduces at commit `0dc6441`. Do not force a fix
  for something you can't observe.

### Step 4: If a fix was made, run full verification

Only if Step 3 resulted in a `next.config.ts` change:

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.

**Verify**: all four exit 0, `pnpm test` reports the same pass count as a
pre-change baseline. Then repeat Step 2's reproduction to confirm the
issue no longer appears in DevTools' Issues panel.

### Step 5: Write up findings

Document in the report file: what was found (or not found), the exact
blocked directive/resource if identified, what action was taken (fixed,
deemed a false positive, or could not reproduce), and — if fixed — the
before/after CSP header diff.

**Verify**: `test -f <report file>` and it's non-empty, and states one of
the three outcomes from Step 3 plainly.

## Test plan

If a `next.config.ts` change is made, no new automated tests are added —
CSP headers aren't currently covered by this repo's test suite (a header
value isn't something `vitest` unit tests naturally exercise without a
running server + real HTTP request, which is a heavier addition than this
plan's scope). The regression guard is: `pnpm build` succeeding, and the
manual DevTools re-check in Step 4 confirming the specific issue is gone
without introducing an overly permissive new allowance.

**Verify**: `pnpm test` → same pass/fail count as baseline (if a fix was
made); no test changes expected either way.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] Step 1's conclusion (was Turnstile rendering in this environment?)
      is stated plainly in the report
- [ ] Step 2 was attempted in a real browser's DevTools Issues panel, not
      just a headless Lighthouse JSON re-run
- [ ] The report states one of: (a) the specific blocked directive/URL
      and the fix applied, (b) the specific blocked directive/URL and why
      it was deemed a false positive / out of this app's control, or (c)
      that the issue could not be reproduced, with the browser/steps tried
- [ ] If `next.config.ts` was changed: `pnpm exec tsc --noEmit`,
      `pnpm lint`, `pnpm test`, `pnpm build` all exit 0, and Step 2's
      reproduction no longer shows the issue
- [ ] If `next.config.ts` was NOT changed: `git status` shows no
      modifications to it
- [ ] A report file exists documenting the outcome
- [ ] `plans/README.md` status row updated (reflecting the actual
      outcome — DONE with the specific finding, not a generic "investigated")

## STOP conditions

Stop and report back (do not improvise) if:

- `next.config.ts` doesn't match the "Current state" excerpt above (drift
  since this plan was written).
- You're tempted to widen the CSP broadly (e.g. adding a wildcard origin,
  or adding `'unsafe-inline'`/`'unsafe-eval'` somewhere it isn't already
  present) to make an issue go away without understanding exactly what
  triggered it — this is exactly the kind of change this plan's "why this
  matters" and "Scope" sections are trying to prevent. Report the
  specific blocked resource instead and let a human weigh in if the fix
  isn't obviously minimal and safe.
- The reproduction (Step 2) reveals a CSP violation caused by something
  that looks like a genuine security concern (e.g. an unexpected
  third-party script loading that isn't part of this app's known
  integrations at all) rather than a benign missing-allowance — stop
  immediately and report this as a potential security issue rather than
  treating it as a routine CSP tuning fix.

## Maintenance notes

- If this turns out to be Turnstile-related and genuinely needs a new
  allowance, double check whether the same allowance should also cover
  `/keystatic` or other routes that might load the same third-party
  script in the future, versus being scoped tightly to `/contact` only
  (the current `headers()` config in `next.config.ts` applies the same
  CSP to `source: "/(.*)"`, i.e. every route gets the same header — there
  is no per-route CSP in this codebase currently, so any fix here is
  necessarily sitewide, not `/contact`-specific, regardless of where the
  issue was observed).
- If the issue turns out to be browser-extension noise (a common false
  positive for strict CSPs), no code action is needed, but it's worth a
  one-line note in this repo's own CSP comment block explaining that
  Lighthouse audits should be run with a clean/incognito browser profile
  to avoid this exact confusion recurring in a future pre-launch pass.
