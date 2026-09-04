# Plan 019: Remove duplicated/dead Turnstile widget-render logic in QuoteForm

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 240e4f8..HEAD -- components/ui/QuoteForm.tsx`
> If the in-scope file changed since this plan was written, compare the
> "Current state" excerpt against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `240e4f8`, 2026-08-07

## Why this matters

`components/ui/QuoteForm.tsx` renders the Cloudflare Turnstile widget by
calling `window.turnstile.render(...)` from two separate places: a
`useEffect` on mount, and the `onLoad` callback of the `<Script>` tag that
loads Turnstile's JS. Both blocks pass an identical options object. In
practice, the `useEffect` runs once on mount with dependency `[siteKey]`;
since the `<Script>` uses `strategy="lazyOnload"`, the Turnstile script has
not finished loading by the time that effect first runs, so
`window.turnstile` is `undefined`, the effect's `if (!w.turnstile) return;`
guard fires, and the effect never runs again (it has no way to re-check once
the script does load, since nothing re-triggers it). The `Script`'s `onLoad`
handler is what actually renders the widget in every real page load. The
`useEffect` block is therefore dead code under normal load order — it only
does something in a scenario where Turnstile's script object is already on
`window` before this component mounts (e.g. a same-page remount after a
client-side navigation, if the script tag itself persisted). Leaving a
duplicated render call in the codebase that looks load-bearing but mostly
isn't is confusing for the next person who touches Turnstile, and if load
timing ever changes (e.g. switching `strategy`), the two render calls could
both fire and double-render the widget. Consolidating to one render path
removes both risks.

## Current state

- `components/ui/QuoteForm.tsx:54-68` — the `useEffect` render path:

```tsx
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Render Turnstile widget after script loads
useEffect(() => {
  if (!siteKey || !turnstileRef.current) return;
  const w = window as typeof window & { turnstile?: { render: (el: HTMLElement, opts: object) => void } };
  if (!w.turnstile) return;
  w.turnstile.render(turnstileRef.current, {
    sitekey: siteKey,
    callback: (token: string) => setTurnstileToken(token),
    "expired-callback": () => setTurnstileToken(null),
    "error-callback": () => setTurnstileToken(null),
    theme: "auto",
  });
}, [siteKey]);
```

- `components/ui/QuoteForm.tsx:143-161` — the `<Script onLoad>` render path
  (the one that actually fires in practice, since the script is
  `lazyOnload`):

```tsx
{siteKey && (
  <Script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js"
    strategy="lazyOnload"
    onLoad={() => {
      const w = window as typeof window & { turnstile?: { render: (el: HTMLElement, opts: object) => void } };
      if (w.turnstile && turnstileRef.current) {
        w.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(null),
          "error-callback": () => setTurnstileToken(null),
          theme: "auto",
        });
      }
    }}
  />
)}
```

- Both blocks reference `turnstileRef` (a `useRef<HTMLDivElement>(null)`
  declared near the top of the component) and `setTurnstileToken` (a
  `useState` setter). Neither of those declarations changes in this plan.
- The mount point `<div ref={turnstileRef} className="mt-2" />` at
  `components/ui/QuoteForm.tsx:339-341` is unchanged.
- This repo has no automated tests for `QuoteForm.tsx` (only
  `app/api/send/route.test.ts` exists, testing the API route). Verification
  here is manual/visual, per the Test plan below.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|-------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Lint      | `pnpm lint`              | exit 0              |
| Build     | `pnpm build`             | exit 0              |

## Scope

**In scope**:
- `components/ui/QuoteForm.tsx`

**Out of scope** (do NOT touch, even though they look related):
- The rest of `QuoteForm.tsx` — form fields, submit handling, validation
  (see plan 018 if that's also selected), file upload — unrelated to
  Turnstile rendering.
- `app/api/send/route.ts`'s `verifyTurnstile` function — the server-side
  verification is a separate, correct concern; not touched by this plan.

## Git workflow

- Branch: `advisor/019-dedupe-turnstile-render`
- Commit per step; conventional-commit style matching `git log` (e.g.
  `feat: integrate Turnstile for enhanced form security and add email
  configuration for quote requests`, commit `89bd0bf`, is the original
  feature commit this plan cleans up after).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extract one render function and call it only from `onLoad`

Replace both blocks shown in "Current state" with a single helper and one
call site:

```tsx
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const renderTurnstile = useCallback(() => {
  const w = window as typeof window & {
    turnstile?: { render: (el: HTMLElement, opts: object) => void };
  };
  if (!siteKey || !w.turnstile || !turnstileRef.current) return;
  w.turnstile.render(turnstileRef.current, {
    sitekey: siteKey,
    callback: (token: string) => setTurnstileToken(token),
    "expired-callback": () => setTurnstileToken(null),
    "error-callback": () => setTurnstileToken(null),
    theme: "auto",
  });
}, [siteKey]);
```

Remove the `useEffect` block entirely (the one shown first in "Current
state") — it never does anything under real load order, per "Why this
matters". Add `useCallback` to the existing `import { useState, useRef,
useEffect } from "react";` line if `useEffect` is still used elsewhere in
this file for something unrelated to Turnstile (check with
`grep -n "useEffect" components/ui/QuoteForm.tsx` before removing the import
specifier — only remove `useEffect` from the import if this was its only
use in the file).

Then update the `<Script onLoad>` to call the extracted function:

```tsx
{siteKey && (
  <Script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js"
    strategy="lazyOnload"
    onLoad={renderTurnstile}
  />
)}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm build
```

**Verify**: all three exit 0.

## Test plan

No automated tests exist for this component and this plan doesn't add a
component-testing setup (that's a larger, separate investment). Manual
verification, since this is security-adjacent UI (a broken Turnstile widget
means every quote submission silently fails or bypasses the challenge):

1. Ensure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in `.env.local` (use
   Cloudflare's public Turnstile testing sitekey
   `1x00000000000000000000AA`, which always passes, if no real key is
   configured — do not use a real production sitekey for local testing).
2. Run `pnpm dev`, open `/contact`.
3. Confirm the Turnstile widget renders below the submit button (it should
   appear once, not disappear/reappear or duplicate).
4. Open the browser devtools Network tab, confirm `api.js` loads exactly
   once.
5. Submit the form with valid data, confirm the request to `/api/send`
   includes a `turnstileToken` in its JSON body (check the Network tab's
   request payload).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -c "turnstile.render" components/ui/QuoteForm.tsx` returns `1` (was 2 before this change)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code in `QuoteForm.tsx` no longer matches the "Current state"
  excerpts (e.g. the `useEffect` block has since been given a real
  script-loaded dependency that makes it non-dead — re-read the live file
  and confirm the dead-code reasoning still holds before deleting it).
- `useEffect` turns out to be used elsewhere in this file for something
  unrelated — don't remove the import specifier in that case, only remove
  the Turnstile-specific effect block.
- Manual verification (Step in "Test plan") shows the widget fails to
  render, renders twice, or the submitted request is missing
  `turnstileToken`.

## Maintenance notes

- If Turnstile's load strategy ever changes away from `lazyOnload` (e.g. to
  a strategy where the script may already be cached/loaded before this
  component mounts), re-verify whether a mount-time check is needed again —
  the reasoning in "Why this matters" is specific to `lazyOnload` behavior.
- A reviewer should scrutinize: that `renderTurnstile` is called from
  exactly one place, and that the manual verification steps were actually
  run (this is unusually easy to "fix" in a way that looks right but
  silently breaks Turnstile — the widget failing to render doesn't throw or
  fail typecheck/build).
