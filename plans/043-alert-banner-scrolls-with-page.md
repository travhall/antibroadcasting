# Plan 043: Make the alert banner scroll with the page instead of staying fixed

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 5d3b164..HEAD -- components/ui/AlertBanner.tsx components/layout/Header.tsx components/layout/MainChrome.tsx "app/(site)/layout.tsx"`
> If any of those four files changed since this plan was written, compare
> the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (touches header positioning sitewide — low complexity per
  file, but every page renders through this)
- **Depends on**: none. Supersedes plan 035 (already reverted — see
  `plans/README.md`'s row for it) with a structurally different approach
  to the same underlying complaint.
- **Category**: bug (UX)
- **Planned at**: commit `5d3b164`, 2026-09-28

## Why this matters

The sitewide alert banner (`components/ui/AlertBanner.tsx`) is currently
`position: fixed`, permanently pinned to the top of the viewport on every
route until a visitor explicitly dismisses it — it never scrolls away on
its own. Plan 035 tried to fix the "eats viewport height forever" problem
by force-hiding the banner via JavaScript after ~24px of scroll, but that
turned out to be the wrong shape of fix (reverted 2026-09-28, see plan
035's row in `plans/README.md`): the collapse was one-way and
never reappeared without a hard reload, so the banner vanished on the
first scroll tick and stayed gone — not "out of the way," just gone.

**The correct fix, per the site owner's own diagnosis**: the banner
should behave like an ordinary piece of page content that scrolls away
naturally as the visitor scrolls down — no JavaScript hiding logic needed
at all — while the header "takes over" the pinned top-of-viewport
position once the banner has scrolled out of view. This is the standard
"promo bar above a sticky header" pattern used across the web: the promo
bar sits in normal document flow (not `fixed`), the header uses
`position: sticky; top: 0` instead of `fixed`, and the browser handles
the rest — no scroll listeners, no collapse state, no "stuck forever"
failure mode, and scrolling back up naturally brings the banner back into
view exactly as far as you scroll, which a JS-driven show/hide toggle
can't replicate smoothly.

**This plan's author verified the refactor is safe before writing it**,
specifically checking the one thing that silently breaks `position:
sticky`: an ancestor with `overflow` set to anything other than
`visible` between the header and the viewport. Traced the full ancestor
chain — `app/layout.tsx`'s `<body>` (no `overflow` class),
`app/(site)/layout.tsx`'s `<PageTransitionProvider>` (a React Context
Provider with no DOM element of its own — renders children directly, no
wrapping `<div>`), and `app/globals.css` (no `overflow` rule on `html` or
`body`, confirmed via `grep -n "overflow" app/globals.css`). Nothing in
the chain would prevent `position: sticky` from working correctly.

**Also verified**: `MainChrome.tsx`'s alert-dependent top margin
(`mt-27 lg:mt-43` with an alert vs. `mt-16 lg:mt-32` without) exists
*purely* to compensate for the currently-`fixed` header's height, which
differs by breakpoint (the header is taller on desktop — full nav row
with `py-9` padding — than on mobile, logo-and-hamburger only). Once the
header becomes `sticky` (an in-flow element that always reserves its own
real rendered height in the document), this compensation becomes
unnecessary at every breakpoint automatically — the fix is to delete the
margin logic, not adjust its values.

## Current state

`components/ui/AlertBanner.tsx` — both the `ticker` branch and the
default (`message`) branch use `fixed top-0 inset-x-0 z-101`
(verified by direct read):

```tsx
// ticker branch, line 36:
        className="fixed top-0 inset-x-0 z-101 h-11 flex items-center bg-bg-warning border-b border-border-warning overflow-hidden"

// message branch, line 69:
        className="fixed top-0 inset-x-0 z-101 h-11 flex items-center gap-3 bg-bg-warning border-b border-border-warning px-4 md:px-6 lg:px-8 xl:px-12"
```

`components/layout/Header.tsx` (full file relevant excerpts, verified by
direct read):

```tsx
import { useAlertVisible } from "@/lib/alert-visibility";
// ...
export function Header({
  siteInfo,
  activeAlert = null,
}: {
  siteInfo: SiteInfo;
  activeAlert?: ActiveAlert | null;
}) {
  const hasAlert = useAlertVisible(activeAlert);
  // ... (open, hidden, lastScrollY, drawerRef, etc. — all unrelated, keep as-is)
```

and its `<header>` element (line 232-235):

```tsx
      <header
        className={`fixed ${hasAlert ? "top-11" : "top-0"} left-0 right-0 z-100 px-4 md:px-6 lg:px-8 xl:px-12 flex items-center justify-between bg-bg-base border-b border-foreground/10 transition-transform duration-300 ease-in-out ${hidden ? "-translate-y-full" : "translate-y-0"}`}
        onFocus={() => setHidden(false)}
      >
```

`hasAlert` is used **only** in that one ternary (`top-11` vs `top-0`) —
confirmed by reading the full file; nowhere else in `Header.tsx` does
`hasAlert` or `activeAlert` appear. The scroll-hide logic (`hidden`
state, `SCROLL_HIDE_THRESHOLD`, the `useEffect` at lines 127-142) is a
**separate, independent mechanism** — it hides the header on scroll-down
and reveals it on scroll-up via `transform: translateY(-100%)`, and has
nothing to do with the alert banner. It must be left untouched; `position:
sticky` + `transform` compose exactly the same way `position: fixed` +
`transform` did.

`components/layout/MainChrome.tsx` (full file, verified by direct read):

```tsx
"use client";

import type { ReactNode } from "react";
import type { ActiveAlert } from "@/lib/get-active-alert";
import { useAlertVisible } from "@/lib/alert-visibility";

export function MainChrome({
  activeAlert,
  children,
}: {
  activeAlert: ActiveAlert | null;
  children: ReactNode;
}) {
  const hasAlert = useAlertVisible(activeAlert);

  // <main> is a landmark, not a control: the router and the skip link focus it
  // programmatically, so it takes no visible focus ring (it read as a stray rule).
  return (
    <main
      id="main-content"
      className={`flex flex-col flex-1 ${hasAlert ? "mt-27 lg:mt-43" : "mt-16 lg:mt-32"} px-4 md:px-6 lg:px-8 xl:px-12 pb-0 bg-bg-base relative z-10 focus:outline-none`}
    >
      {children}
    </main>
  );
}
```

`app/(site)/layout.tsx` (full file, verified by direct read):

```tsx
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PageTransitionProvider } from "@/components/layout/PageTransitionProvider";
import { MainChrome } from "@/components/layout/MainChrome";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { getSiteInfo } from "@/lib/get-site-info";
import { getActiveAlert } from "@/lib/get-active-alert";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [siteInfo, activeAlert] = await Promise.all([
    getSiteInfo(),
    getActiveAlert(),
  ]);

  return (
    <PageTransitionProvider>
      {/* Grain overlay — SVG noise texture, fixed, site-wide */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />
      {activeAlert && <AlertBanner alert={activeAlert} />}
      <Header siteInfo={siteInfo} activeAlert={activeAlert} />
      <div className="flex flex-col min-h-screen">
        <MainChrome activeAlert={activeAlert}>{children}</MainChrome>
        <Footer siteInfo={siteInfo} />
      </div>
    </PageTransitionProvider>
  );
}
```

Note the DOM order is already correct for this refactor: `AlertBanner`
renders *before* `Header` in the tree, which is exactly the order needed
for the sticky-header effect (the banner must be the sibling *above* the
header for the header to "catch" at the top once the banner scrolls past).

`lib/alert-visibility.ts`'s `useAlertVisible` hook (already reverted to
its pre-035, dismiss-only form as of commit `5d3b164` — **do not
re-introduce any scroll-collapse logic here**; this plan doesn't touch
this file at all, it only removes *callers* of `useAlertVisible` that no
longer need it).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0, no errors   |
| Tests     | `pnpm test`               | all pass, same count as before this plan |
| Lint      | `pnpm lint`               | exit 0               |
| Build     | `pnpm build`              | exit 0               |
| Dev server (manual check) | `pnpm dev` | serves locally |

## Scope

**In scope** (the only files you should modify):
- `components/ui/AlertBanner.tsx`
- `components/layout/Header.tsx`
- `components/layout/MainChrome.tsx`
- `app/(site)/layout.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `lib/alert-visibility.ts` — no changes; `useAlertVisible`'s
  dismiss-only behavior (post-035-revert) is correct and stays exactly
  as-is. This plan only removes callers that no longer need it (Header,
  MainChrome), not the hook itself (AlertBanner still needs it).
- `lib/get-active-alert.ts` — unrelated, no changes.
- The mobile nav drawer's "Spacer that clears the fixed header"
  (`components/layout/Header.tsx`, the `<div className="flex-none h-24" ... />`
  inside the `<nav id={DRAWER_ID}>` block) — this spacer's fixed height
  approximates the header's own rendered height, which this plan does
  **not** change (only the header's *positioning mechanism* changes, not
  its padding/height/contents). Leave it untouched.
- Header's scroll-hide behavior (`hidden` state, `SCROLL_HIDE_THRESHOLD`,
  the scroll `useEffect`) — independent mechanism, do not modify.
- The grain-overlay `<div>` and its `z-50` in `app/(site)/layout.tsx` —
  unrelated fixed decorative layer, leave as-is.
- `content/alert-banner.json` / `keystatic.config.ts`'s `alertBanner`
  schema — this is a pure layout/CSS refactor, no CMS schema changes.

## Git workflow

- Branch: `advisor/043-alert-banner-scrolls-with-page` — MED risk (touches
  every page's header), a branch makes it easy to review the full diff
  before merging.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `refactor: make alert banner scroll with page, header sticky`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Un-fix the alert banner

In `components/ui/AlertBanner.tsx`, in the `ticker` branch, replace:

```tsx
        className="fixed top-0 inset-x-0 z-101 h-11 flex items-center bg-bg-warning border-b border-border-warning overflow-hidden"
```

with:

```tsx
        className="h-11 flex items-center bg-bg-warning border-b border-border-warning overflow-hidden"
```

And in the default (`message`) branch, replace:

```tsx
        className="fixed top-0 inset-x-0 z-101 h-11 flex items-center gap-3 bg-bg-warning border-b border-border-warning px-4 md:px-6 lg:px-8 xl:px-12"
```

with:

```tsx
        className="h-11 flex items-center gap-3 bg-bg-warning border-b border-border-warning px-4 md:px-6 lg:px-8 xl:px-12"
```

(Only `fixed top-0 inset-x-0 z-101` is removed from each — everything
else on both elements stays exactly as-is. Both are `<div>`s, which are
block-level by default, so dropping the fixed-positioning classes is
enough to make them full-width, normal-flow content — no replacement
width class is needed.)

**Verify**: `grep -n "fixed" components/ui/AlertBanner.tsx` returns no
matches.

### Step 2: Make the header sticky instead of fixed, and drop its alert-awareness

In `components/layout/Header.tsx`, remove the now-unused import:

```tsx
import { useAlertVisible } from "@/lib/alert-visibility";
```

Change the function signature from:

```tsx
export function Header({
  siteInfo,
  activeAlert = null,
}: {
  siteInfo: SiteInfo;
  activeAlert?: ActiveAlert | null;
}) {
  const hasAlert = useAlertVisible(activeAlert);
  const [open, setOpen] = useState(false);
```

to:

```tsx
export function Header({
  siteInfo,
}: {
  siteInfo: SiteInfo;
}) {
  const [open, setOpen] = useState(false);
```

Check whether `ActiveAlert` is still used elsewhere in this file after
this change (it was only used for the `activeAlert` prop's type) — if
its import (`import type { ActiveAlert } from "@/lib/get-active-alert";`)
becomes unused, remove that import too.

Then replace the `<header>` element's className:

```tsx
        className={`fixed ${hasAlert ? "top-11" : "top-0"} left-0 right-0 z-100 px-4 md:px-6 lg:px-8 xl:px-12 flex items-center justify-between bg-bg-base border-b border-foreground/10 transition-transform duration-300 ease-in-out ${hidden ? "-translate-y-full" : "translate-y-0"}`}
```

with:

```tsx
        className={`sticky top-0 z-100 px-4 md:px-6 lg:px-8 xl:px-12 flex items-center justify-between bg-bg-base border-b border-foreground/10 transition-transform duration-300 ease-in-out ${hidden ? "-translate-y-full" : "translate-y-0"}`}
```

(`fixed ${hasAlert ? "top-11" : "top-0"} left-0 right-0` becomes
`sticky top-0` — `left-0 right-0` are dropped because they were only
needed to give a `fixed`, out-of-flow element full width; a `sticky`
element is still in normal flow and is already full-width as a block-level
`<header>`. Everything else on this element — `z-100`, padding, flex
layout, background, border, the scroll-hide transform/transition — stays
exactly as-is.)

**Verify**: `grep -n "hasAlert\|useAlertVisible" components/layout/Header.tsx`
returns no matches. `grep -n "sticky top-0" components/layout/Header.tsx`
returns a match.

### Step 3: Remove MainChrome's alert-dependent margin entirely

In `components/layout/MainChrome.tsx`, replace the full file with:

```tsx
"use client";

import type { ReactNode } from "react";

export function MainChrome({ children }: { children: ReactNode }) {
  // <main> is a landmark, not a control: the router and the skip link focus it
  // programmatically, so it takes no visible focus ring (it read as a stray rule).
  return (
    <main
      id="main-content"
      className="flex flex-col flex-1 px-4 md:px-6 lg:px-8 xl:px-12 pb-0 bg-bg-base relative z-10 focus:outline-none"
    >
      {children}
    </main>
  );
}
```

(Drops the `ActiveAlert` type import, the `useAlertVisible` import, the
`activeAlert` prop, the `hasAlert` computation, and the
`mt-27 lg:mt-43` / `mt-16 lg:mt-32` conditional margin — with the header
now `sticky` and reserving its own real height in the flow, no manual
compensation is needed at any breakpoint. Every other class on `<main>`
— `flex flex-col flex-1`, padding, background, z-index, focus outline —
stays exactly as-is, matching plan 034's earlier `flex-1` fix.)

**Verify**: `grep -n "useAlertVisible\|hasAlert\|mt-16\|mt-27" components/layout/MainChrome.tsx`
returns no matches.

### Step 4: Update the call sites in the layout

In `app/(site)/layout.tsx`, replace:

```tsx
      <Header siteInfo={siteInfo} activeAlert={activeAlert} />
      <div className="flex flex-col min-h-screen">
        <MainChrome activeAlert={activeAlert}>{children}</MainChrome>
        <Footer siteInfo={siteInfo} />
      </div>
```

with:

```tsx
      <Header siteInfo={siteInfo} />
      <div className="flex flex-col min-h-screen">
        <MainChrome>{children}</MainChrome>
        <Footer siteInfo={siteInfo} />
      </div>
```

`activeAlert` remains used just above this (in
`{activeAlert && <AlertBanner alert={activeAlert} />}`) and in the
`Promise.all` fetch — do not remove those; only the two prop-passing call
sites change.

**Verify**: `grep -n "activeAlert" "app/(site)/layout.tsx"` shows exactly
two remaining matches (the `getActiveAlert()` fetch/destructure and the
`{activeAlert && <AlertBanner ...>}` line) — not the `Header`/`MainChrome`
call sites.

### Step 5: Full verification sweep

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build` — in
that order.

**Verify**: all four exit 0. `pnpm test` reports the same pass count as a
pre-change baseline (this plan doesn't add or remove tests).

### Step 6: Manual browser confirmation

Run `pnpm dev` (or `pnpm build && pnpm start`) with an active,
`dismissible` alert configured (check `content/alert-banner.json` has
`"active": true` — if not, temporarily set it for this check only, and
revert before committing), then in a browser:

1. Load the homepage. Confirm the alert banner renders at the very top,
   with the header directly beneath it, both visible, exactly as before
   this change.
2. Scroll down slowly. Confirm the banner scrolls up and out of view
   *with the page content* (not instantly hidden by a threshold — it
   should track your scroll position continuously), and once it's fully
   scrolled past, the header "catches" at the top of the viewport and
   stays there while the rest of the page continues scrolling beneath it.
3. Scroll back up to the very top. Confirm the banner scrolls back into
   view smoothly, tracking your scroll position exactly (not a sudden
   pop-in) — this is the core behavior plan 035's JS-collapse approach
   could not provide.
4. Confirm the header's own scroll-hide behavior (hides on scroll-down
   past a small threshold, reappears on scroll-up) still works correctly
   layered on top of the new sticky positioning — this should look
   unchanged from before this plan.
5. Load `/contact`, `/privacy`, or another page confirmed short by plan
   034 (footer-gap fix). Confirm there's no dead gap or unexpected overlap
   between the header and the page content now that `MainChrome`'s margin
   is gone — content should start immediately below the header with no
   visible seam or double-spacing.
6. Click the alert's dismiss (X) button. Confirm it still hides the
   banner and the header (and page content) shift up to fill the space,
   exactly as before — this plan doesn't change `dismissAlert`'s behavior.
7. Resize to mobile width (390px) and repeat steps 1–3. Confirm the
   mobile hamburger menu still opens correctly and its own spacer still
   clears the header with no visual gap or overlap (this spacer's height
   wasn't changed by this plan, so it should look identical to before).
8. If a `ticker`-type alert is configured (check
   `content/alert-banner.json`'s `content.discriminant`), repeat steps
   1–3 with it active too — the ticker branch was changed identically to
   the message branch in Step 1.

## Test plan

No new automated tests — this is a CSS positioning refactor with no new
conditional application logic (if anything, less logic than before: two
props and one computed boolean are removed). The existing `pnpm test`
suite is the regression guard for anything with existing coverage (check
whether `Header.test.tsx` or similar exists — if so, and it asserts on
props this plan removes, e.g. `activeAlert`, update the test call site to
drop that prop, not the assertions themselves, unless the assertions
specifically test the removed `hasAlert`/margin behavior, in which case
remove exactly those assertions and note it in your final summary).

**Verify**: `pnpm test` → same pass/fail count as a pre-change baseline,
unless a test needed updating per the above (in which case, only that
specific test file changes, and the reason is a straightforward prop
removal, not a behavior regression).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "fixed" components/ui/AlertBanner.tsx` — no matches
- [ ] `grep -n "hasAlert\|useAlertVisible" components/layout/Header.tsx` — no matches
- [ ] `grep -n "sticky top-0" components/layout/Header.tsx` matches
- [ ] `grep -n "useAlertVisible\|hasAlert\|mt-16\|mt-27" components/layout/MainChrome.tsx` — no matches
- [ ] `grep -n "activeAlert" "app/(site)/layout.tsx"` shows exactly 2 matches
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, same count as baseline (or documented if a
      prop-removal-driven test update was needed)
- [ ] `pnpm build` exits 0
- [ ] Manual check (Step 6) confirms: banner scrolls naturally with the
      page, header sticks to the top once the banner scrolls past, banner
      reappears smoothly on scroll-up, header's own scroll-hide still
      works, no gap/overlap on short pages, dismiss button still works,
      mobile drawer unaffected
- [ ] No files outside the four in-scope files (and, only if needed, a
      `Header` test file) are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the four in-scope files don't match the "Current state" excerpts
  above (drift since this plan was written).
- The manual check reveals the header does NOT stick to the top once the
  banner scrolls past (e.g. it scrolls away with the banner instead) —
  this would mean an `overflow` ancestor this plan's author didn't catch
  is breaking `position: sticky`. Report the exact page/browser where
  this happens and re-check the full ancestor chain (`html`, `body`,
  every wrapping element) for `overflow` other than `visible`, rather
  than switching the header back to `fixed` as a workaround.
- The manual check reveals a visible gap or overlap between the header
  and page content on any page after `MainChrome`'s margin removal —
  report which page and whether it's a gap (too much space) or overlap
  (content hidden under the header), since the two point to different
  causes (a gap suggests something else is still adding spacing; an
  overlap suggests the header isn't actually reserving its flow space,
  which would itself indicate the sticky positioning isn't working).
- A `Header.test.tsx` or similar test file exists and asserts on
  visual/positioning behavior (not just props) that this plan's changes
  would legitimately break — report the specific test and its assertion
  rather than deleting or rewriting it to force a pass.

## Maintenance notes

- Future alert-banner or header work should not need to reintroduce any
  coupling between the two — the whole point of this refactor is that
  `Header` and `MainChrome` no longer need to know whether an alert is
  active at all. If a future feature seems to require that coupling
  again, treat that as a signal to reconsider the approach, not as
  routine plumbing to re-add.
- If the site ever wants the alert banner to *also* have its own
  scroll-triggered behavior (e.g., a subtle fade), that's a new,
  separate feature request — this plan deliberately does not reintroduce
  any of plan 035's collapse logic, reverted or otherwise, per the site
  owner's explicit call that the collapse-and-never-return shape was the
  wrong fix.
- The mobile drawer's `h-24` spacer (`Header.tsx`) is a hardcoded
  approximation of the header's rendered height. If a future change
  alters the header's actual height (e.g. bigger logo, more nav items),
  a reviewer should re-check that spacer value then — it's unrelated to
  this plan but sits in the same file and is easy to overlook.
