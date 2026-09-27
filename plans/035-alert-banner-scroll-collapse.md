# Plan 035: Auto-collapse the sitewide alert banner after the first scroll

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0dc6441..HEAD -- lib/alert-visibility.ts`
> If it changed since this plan was written, compare the "Current state"
> excerpt below against the live file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug (UX)
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

An external site audit (2026-09-27) found that the sitewide alert banner
("Sorry to mention this since fall hasn't hit yet but — Now booking Holiday
2026!") is fixed above the header on **every route**, not just the
homepage, and stays visible until a visitor manually dismisses it. On
mobile that's roughly 44px of permanently fixed chrome stacked above an
already-fixed header, eating a meaningful chunk of a small viewport for
the entire session unless the visitor notices and taps the dismiss button.

Verified in code: `content/alert-banner.json` has `"active": true` with no
`expiresAt`, and `app/(site)/layout.tsx:29` renders `<AlertBanner>`
unconditionally (no route check) whenever `getActiveAlert()` returns a
banner — so this is genuinely sitewide, matching the audit's finding
exactly. `MainChrome.tsx` reserves an extra `mt-27`/`mt-43` (vs.
`mt-16`/`mt-32` with no alert) of margin whenever the banner is visible —
11 Tailwind spacing units, i.e. 44px, confirming the audit's "roughly 44px"
figure precisely.

The audit's suggested fix is either "scope it to the homepage" or
"auto-collapse it after the first scroll." This plan implements the
scroll-collapse option: it requires touching only one shared file
(`lib/alert-visibility.ts`) rather than adding a new CMS field and
route-check plumbing, and it preserves the banner's usefulness on every
page (a visitor landing directly on `/contact` from a search result still
sees the holiday-booking notice once) while no longer permanently eating
viewport space once they've started reading the page.

## Current state

`lib/alert-visibility.ts` (full file) — this is the single shared store
that `components/ui/AlertBanner.tsx`, `components/layout/Header.tsx`
(`hasAlert` controls its `top-11`/`top-0` offset), and
`components/layout/MainChrome.tsx` (`hasAlert` controls its margin) all
read via `useAlertVisible(activeAlert)`. Changing this one file's
returned visibility automatically propagates to all three consumers —
this is the existing, intentional design (see the file's own comment
below):

```ts
"use client";

import { useSyncExternalStore } from "react";
import type { ActiveAlert } from "@/lib/get-active-alert";

const STORAGE_KEY = "ab-alert-dismissed";

/** Cheap non-cryptographic hash so editing the message resurfaces it for visitors who dismissed the old one. */
function hashContent(alert: ActiveAlert): string {
  const raw = `${alert.title ?? ""}|${alert.message}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

// Dismissing needs to collapse the header's offset and the page's top margin
// in the same tick as the alert itself, so all three read from one shared
// store instead of each re-deriving "is it dismissed" independently.
let dismissedThisLoad = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function isStoredAsDismissed(alert: ActiveAlert): boolean {
  if (!alert.dismissible) return false;
  return window.localStorage.getItem(STORAGE_KEY) === hashContent(alert);
}

/** True while `alert` should be shown (and layout should reserve space for it). */
export function useAlertVisible(alert: ActiveAlert | null): boolean {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => dismissedThisLoad || (alert !== null && isStoredAsDismissed(alert)),
    () => false,
  );
  return alert !== null && !dismissed;
}

export function dismissAlert(alert: ActiveAlert) {
  if (alert.dismissible) {
    window.localStorage.setItem(STORAGE_KEY, hashContent(alert));
  }
  dismissedThisLoad = true;
  notify();
}
```

- Note the `ticker`-type alert (`components/ui/AlertBanner.tsx:17-64`) is
  **not dismissible by design** (`dismissible: false` hardcoded at
  `lib/get-active-alert.ts`'s ticker branch) — the scroll-collapse in this
  plan must apply to both `message` and `ticker` alert types equally,
  since both consume `useAlertVisible` the same way. This is actually a
  net improvement for tickers specifically, since they currently have *no*
  way to go away at all before this plan.
- Repo convention for module-level client state: this file already uses
  a plain module-level mutable variable (`dismissedThisLoad`) plus a
  manual `listeners`/`notify`/`subscribe` trio instead of a React
  `useEffect`-per-component pattern — extend it the same way, don't
  introduce a `useEffect` scroll listener inside a component instead.
- For contrast, `components/layout/Header.tsx:127-142` has its own,
  separate, per-component `useEffect` + `window.addEventListener("scroll", ...)`
  for its scroll-to-hide behavior. That listener is independent of this
  plan's — do not touch `Header.tsx`, do not try to merge or coordinate
  with its listener. Two independent passive scroll listeners on `window`
  is normal and cheap; there is no shared state between them.

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
- `lib/alert-visibility.ts`

**Out of scope** (do NOT touch, even though they look related):
- `components/ui/AlertBanner.tsx`, `components/layout/Header.tsx`,
  `components/layout/MainChrome.tsx` — all three already call
  `useAlertVisible()` and will pick up the new collapse behavior
  automatically once the hook's return value changes. No changes needed
  in any of them.
- `content/alert-banner.json` / `keystatic.config.ts`'s `alertBanner`
  schema — this plan is a pure client-behavior change, not a new CMS
  field. Do not add a "scope to homepage" toggle or any other schema
  change.
- `components/layout/Header.tsx`'s own scroll-hide `useEffect` (lines
  127–142) — a separate, unrelated mechanism; do not merge it with the
  new listener.

## Git workflow

- Branch: none required, or `advisor/035-alert-scroll-collapse` — LOW
  risk, single-file change.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `fix: auto-collapse alert banner after first scroll`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Add scroll-collapse state to the shared store

In `lib/alert-visibility.ts`, replace:

```ts
let dismissedThisLoad = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
```

with:

```ts
let dismissedThisLoad = false;

// Once a visitor has scrolled past a small threshold, the banner has done
// its job of being seen — collapse it for the rest of this page load so it
// doesn't permanently eat viewport height. Not persisted to localStorage:
// unlike an explicit dismiss, this should not follow the visitor to their
// next visit or next page navigation.
let scrolledPastThreshold = false;
const SCROLL_COLLAPSE_THRESHOLD_PX = 24;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

if (typeof window !== "undefined") {
  const handleScroll = () => {
    if (window.scrollY > SCROLL_COLLAPSE_THRESHOLD_PX) {
      scrolledPastThreshold = true;
      notify();
      window.removeEventListener("scroll", handleScroll);
    }
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
}
```

**Verify**: `grep -n "scrolledPastThreshold" lib/alert-visibility.ts`
returns at least 3 matches (declaration, listener, and its use in
`useAlertVisible` from Step 2).

### Step 2: Make `useAlertVisible` respect the new collapse state

Replace:

```ts
export function useAlertVisible(alert: ActiveAlert | null): boolean {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => dismissedThisLoad || (alert !== null && isStoredAsDismissed(alert)),
    () => false,
  );
  return alert !== null && !dismissed;
}
```

with:

```ts
export function useAlertVisible(alert: ActiveAlert | null): boolean {
  const dismissed = useSyncExternalStore(
    subscribe,
    () =>
      dismissedThisLoad ||
      scrolledPastThreshold ||
      (alert !== null && isStoredAsDismissed(alert)),
    () => false,
  );
  return alert !== null && !dismissed;
}
```

**Verify**: `pnpm exec tsc --noEmit` exits 0 (confirms no type errors from
the edit).

### Step 3: Full verification sweep

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.

**Verify**: all four exit 0, `pnpm test` reports the same pass count as a
pre-change baseline.

### Step 4: Manual behavior confirmation

With the CMS alert currently active (`content/alert-banner.json` has
`"active": true` at the time this plan was written — if it's since been
turned off, temporarily flip it to `true` locally for this check only,
and revert before committing):

1. Run `pnpm dev`, load `http://localhost:3000/` in a fresh
   incognito/private window (so no `ab-alert-dismissed` localStorage entry
   exists yet).
2. Confirm the banner is visible at the top on load.
3. Scroll down more than ~24px. Confirm the banner disappears, the header
   moves up to `top-0`, and the page content's top margin shrinks — all in
   the same moment (this is the existing shared-store behavior; scrolling
   should visually match what happens when clicking the dismiss button).
4. Scroll back up to the very top. Confirm the banner does **not**
   reappear (this is a one-way collapse for the session, matching "after
   the first scroll" from the audit's recommendation — not a
   show/hide-on-every-scroll toggle).
5. Navigate to a different route (e.g. `/contact`) via a header link.
   Confirm the banner is visible again on the new page load (the collapse
   is per-page-load state, not persisted — this matches "not a dismiss").
6. Reload the page after scrolling past the threshold once. Confirm the
   banner reappears on reload (same reasoning as step 5).
7. If the banner is `dismissible`, also confirm the explicit dismiss
   button still works and still persists across reloads via
   `localStorage` (unrelated to this change, but verifies the two
   mechanisms — scroll-collapse and explicit-dismiss — don't interfere
   with each other).

## Test plan

No new automated tests exist for this file currently (`lib/alert-visibility.ts`
has no `.test.ts` sibling). Given this is a small, pure-state module driven
by `window.scrollY` and `localStorage` — both awkward to unit test without
a DOM test environment already wired up for scroll simulation — this plan
relies on the manual check in Step 4 rather than adding a test file. If the
repo later adds scroll-simulation test infrastructure, a future test could
assert: `useAlertVisible` returns `true` initially, `false` after
`window.scrollY` exceeds the threshold and a scroll event fires, and stays
`false` even if `scrollY` returns to `0`. Not required for this plan's
done criteria.

**Verify**: `pnpm test` → same pass/fail count as a pre-change baseline
(confirms nothing existing broke; this plan adds no new automated tests).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "scrolledPastThreshold" lib/alert-visibility.ts` returns at
      least 3 matches
- [ ] `grep -n "SCROLL_COLLAPSE_THRESHOLD_PX" lib/alert-visibility.ts`
      matches
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, same count as baseline
- [ ] `pnpm build` exits 0
- [ ] Manual check (Step 4) confirms: banner collapses after ~24px of
      scroll, does not reappear on scroll-back-to-top, reappears on
      reload/new-page-load, and explicit dismiss still persists
      independently
- [ ] No files outside `lib/alert-visibility.ts` are modified
      (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `lib/alert-visibility.ts` doesn't match the "Current state" excerpt
  above (drift since this plan was written) — re-read the live file and
  compare before editing.
- The manual check shows the banner flickering or re-appearing/disappearing
  repeatedly on small scroll movements near the threshold — this would
  mean the one-way `scrolledPastThreshold` flag isn't behaving as a
  one-way latch; report the observed behavior rather than tuning the
  threshold value repeatedly.
- Any existing test imports or mocks `lib/alert-visibility.ts` in a way
  that assumes only `dismissedThisLoad` exists (e.g. resets module state
  between tests by only touching that variable) — if so, the new
  `scrolledPastThreshold` variable may need the same treatment; report
  the specific test file rather than guessing at a fix.

## Maintenance notes

- If the CMS-authored alert content ever needs to be "scoped to the
  homepage only" instead of (or in addition to) scroll-collapse — the
  audit's other suggested option — that would require a new field on the
  `alertBanner` Keystatic singleton (e.g. `homepageOnly: boolean`) plus a
  pathname check in `app/(site)/layout.tsx`. That's a separate, larger
  change (new CMS schema + migration of the existing `content/alert-banner.json`)
  and was not selected for this round; the scroll-collapse in this plan
  addresses the same mobile-viewport complaint with much less surface
  area.
- The `SCROLL_COLLAPSE_THRESHOLD_PX = 24` value is a judgment call, not
  measured from user research — if it feels too eager or too sluggish in
  practice, it's a one-line change to adjust, no structural rework needed.
