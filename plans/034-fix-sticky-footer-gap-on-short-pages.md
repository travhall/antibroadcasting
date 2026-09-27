# Plan 034: Fix orphaned gap between content and footer on short pages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0dc6441..HEAD -- app/\(site\)/layout.tsx components/layout/MainChrome.tsx components/layout/Footer.tsx`
> If any of those three files changed since this plan was written, compare
> the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

An external site audit (2026-09-27) found that the Contact page has a
700–800px dead cream-colored gap between the end of the quote form/sidebar
and the footer, on desktop viewports. It reads as an unfinished page on the
site's most important conversion path. The same root cause affects every
short-content page site-wide (confirmed: Privacy, Terms — both under 150
lines of actual content, both rendered through the same shared layout), not
just Contact, because the bug lives in shared layout components, not in the
Contact page itself.

**Root cause** (verified by reading the code, not just DOM measurement):
`components/layout/MainChrome.tsx` forces `<main>` to be `min-h-screen`
(and `md:min-h-[calc(100vh-4.5rem)]`), independent of the footer.
`components/layout/Footer.tsx` separately sets `lg:sticky lg:bottom-0`.
With no shared flex container spanning both, these two rules don't
cooperate: `<main>` unconditionally reserves at least one full viewport of
height even when its actual content (e.g. a short contact form) doesn't
need it, and the footer sits immediately after that inflated `<main>`
rather than being pushed down naturally by real content or up against a
short one. Git history confirms this isn't a deliberate, documented
tradeoff — the footer has carried `sticky bottom-0` since its first
commit, and the class was later narrowed to `lg:sticky lg:bottom-0` in
commit `89386dc` ("optimize mobile drawer navigation...") with no comment
explaining why, and no design doc records this as an intentional
sticky-footer effect (checked: no `DESIGN.md`/ADR in the repo mentions it).

The fix is the standard Tailwind sticky-footer pattern: one flex column
wrapper around `<main>` + `<footer>` with `min-h-screen`, `<main>` set to
`flex-1` (grow to fill remaining space) instead of carrying its own
independent `min-h-screen`, and the footer's `position: sticky` removed
entirely (in a proper flex sticky-footer layout it's unnecessary — the
footer is already pinned to the bottom of a short page purely by `<main>`
growing to fill the remaining space).

## Current state

- `app/(site)/layout.tsx` (full file) — `<Header>` (rendered `fixed`, out
  of normal document flow — see `components/layout/Header.tsx:233`,
  `className={... fixed ... top-0 ...}`) is a sibling of `<MainChrome>`
  and `<Footer>`, not a parent, so it can be ignored for this flex-column
  restructuring:

  ```tsx
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
          style={{ /* ...svg data-uri, unchanged... */ }}
        />
        {activeAlert && <AlertBanner alert={activeAlert} />}
        <Header siteInfo={siteInfo} activeAlert={activeAlert} />
        <MainChrome activeAlert={activeAlert}>{children}</MainChrome>
        <Footer siteInfo={siteInfo} />
      </PageTransitionProvider>
    );
  }
  ```

- `components/layout/MainChrome.tsx` (full file):

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
        className={`flex flex-col min-h-screen md:min-h-[calc(100vh-4.5rem)] ${hasAlert ? "mt-27 lg:mt-43" : "mt-16 lg:mt-32"} px-4 md:px-6 lg:px-8 xl:px-12 pb-0 bg-bg-base relative z-10 focus:outline-none`}
      >
        {children}
      </main>
    );
  }
  ```

- `components/layout/Footer.tsx:16-19` (signature + opening tag only —
  everything inside `<footer>` is unrelated to this fix and must not
  change):

  ```tsx
  export function Footer({ siteInfo }: { siteInfo: SiteInfo }) {
    return (
      <footer
        className="bg-bg-subtle lg:sticky lg:bottom-0 z-0 border-t border-foreground/10"
        onFocus={(e) => {
          // Only trigger when focus enters the footer from outside — not on every
          // child re-focus. This prevents the jarring scroll-to-bottom firing on
          // each Tab keypress while navigating footer links.
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: reduced ? "instant" : "smooth",
          });
        }}
      >
  ```
  The `onFocus` handler (accessibility feature: scrolls the page so a
  keyboard user tabbing into the footer can see it) is independent of
  `position: sticky`/flex layout and must be preserved byte-for-byte.

- Repo convention: Tailwind v4 utility classes inline in JSX, no separate
  CSS modules for layout. `flex-1` is already used elsewhere for
  flex-grow children (e.g. `app/(site)/contact/page.tsx:56`,
  `<div className="flex-2 min-w-0">` — same convention, different ratio).
  Match this existing inline-utility style; don't introduce a new CSS
  file or `@apply` rule for this fix.

- **Explicitly NOT part of this bug**: `app/(site)/page.tsx:38`,
  `<section className="relative flex flex-col min-h-screen">` — this is
  the homepage Hero's own decorative full-bleed section, unrelated to the
  `<main>`/`<footer>` sticky-footer mechanism. Do not touch it.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Install   | `pnpm install`            | exit 0 (should be a no-op, no deps change) |
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0, no errors   |
| Tests     | `pnpm test`               | all pass, same count as before this plan |
| Lint      | `pnpm lint`               | exit 0               |
| Build     | `pnpm build`              | exit 0               |
| Dev server (manual check) | `pnpm dev`  | serves on `http://localhost:3000` |

## Scope

**In scope** (the only files you should modify):
- `app/(site)/layout.tsx`
- `components/layout/MainChrome.tsx`
- `components/layout/Footer.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `app/(site)/contact/page.tsx`, `app/(site)/privacy/page.tsx`,
  `app/(site)/terms/page.tsx` — none of these need edits; the fix is
  entirely in the shared layout components and will apply to all three
  (and every other route) automatically once `layout.tsx` wraps them
  correctly.
- `app/(site)/page.tsx`'s Hero `min-h-screen` section (line 38) — a
  separate, intentional full-bleed decorative section, not this bug.
- `components/layout/Header.tsx` — stays `fixed`, not part of this flex
  restructuring; do not change its positioning classes.
- The footer's `onFocus` scroll-to-bottom handler and its contents
  (columns, links, theme toggle, copyright) — layout wrapper/class changes
  only, no content or behavior changes inside `<footer>`.

## Git workflow

- Branch: none required, or `advisor/034-fix-sticky-footer-gap` if the
  repo's current workflow prefers a branch — check `git branch -a` for the
  convention in use; recent history shows both direct-to-`main` commits
  and feature branches, so either is acceptable here given LOW risk.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `fix: resolve sticky-footer gap on short pages`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Wrap `<MainChrome>` and `<Footer>` in a shared flex column

In `app/(site)/layout.tsx`, replace:

```tsx
        <Header siteInfo={siteInfo} activeAlert={activeAlert} />
        <MainChrome activeAlert={activeAlert}>{children}</MainChrome>
        <Footer siteInfo={siteInfo} />
```

with:

```tsx
        <Header siteInfo={siteInfo} activeAlert={activeAlert} />
        <div className="flex flex-col min-h-screen">
          <MainChrome activeAlert={activeAlert}>{children}</MainChrome>
          <Footer siteInfo={siteInfo} />
        </div>
```

**Verify**: `grep -n "flex flex-col min-h-screen" "app/(site)/layout.tsx"`
returns a match.

### Step 2: Make `<main>` grow instead of forcing its own `min-h-screen`

In `components/layout/MainChrome.tsx`, replace:

```tsx
      className={`flex flex-col min-h-screen md:min-h-[calc(100vh-4.5rem)] ${hasAlert ? "mt-27 lg:mt-43" : "mt-16 lg:mt-32"} px-4 md:px-6 lg:px-8 xl:px-12 pb-0 bg-bg-base relative z-10 focus:outline-none`}
```

with:

```tsx
      className={`flex flex-col flex-1 ${hasAlert ? "mt-27 lg:mt-43" : "mt-16 lg:mt-32"} px-4 md:px-6 lg:px-8 xl:px-12 pb-0 bg-bg-base relative z-10 focus:outline-none`}
```

(Only the `min-h-screen md:min-h-[calc(100vh-4.5rem)]` → `flex-1` swap.
Every other class — the alert-dependent margin, padding, background,
z-index, focus outline — stays exactly as-is.)

**Verify**: `grep -n "min-h-screen" components/layout/MainChrome.tsx`
returns no matches. `grep -n "flex-1" components/layout/MainChrome.tsx`
returns a match.

### Step 3: Remove `position: sticky` from the footer

In `components/layout/Footer.tsx`, replace:

```tsx
      className="bg-bg-subtle lg:sticky lg:bottom-0 z-0 border-t border-foreground/10"
```

with:

```tsx
      className="bg-bg-subtle z-0 border-t border-foreground/10"
```

**Verify**: `grep -n "sticky" components/layout/Footer.tsx` returns no
matches.

### Step 4: Full verification sweep

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build` — in
that order.

**Verify**: all four exit 0. `pnpm test` reports the same pass count as
a baseline run before Step 1 (this plan doesn't add or remove tests, so
any count change means something broke).

### Step 5: Manual visual confirmation

Run `pnpm build && pnpm start` (or `pnpm dev` if faster to iterate), then
in a browser at a desktop viewport (1440×900 or similar):

1. Load `http://localhost:3000/contact`. Confirm the footer sits directly
   below the quote form/sidebar content with no visible gap of empty
   cream-colored space.
2. Load `http://localhost:3000/privacy` and `http://localhost:3000/terms`.
   Confirm the same — footer flush under the short policy text, no gap.
3. Load `http://localhost:3000/` (homepage, long content) and
   `http://localhost:3000/portfolio`. Confirm nothing regressed — footer
   still appears only after scrolling past all page content, exactly as
   before this change (these pages are tall enough that the bug never
   showed on them; they're the regression check, not a new use case).
4. Resize to a mobile width (390px) and repeat step 1. Confirm the footer
   still renders correctly (previously `lg:sticky` never applied below
   `lg`, so mobile should look visually unchanged).

There's no existing automated visual-regression suite in this repo for
this — this manual pass is the primary verification for the actual bug;
Step 4's commands are the regression guard for everything else.

## Test plan

No new automated tests — this is a CSS/layout fix with no testable
application logic (no new conditional behavior, no new function). The
existing `pnpm test` suite is the regression guard: if the restructuring
broke a component's rendering (e.g. `MainChrome` or `Footer` have any
existing tests), they must still pass unchanged.

**Verify**: `pnpm test` → same pass/fail count as a pre-change baseline
run.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "flex flex-col min-h-screen" "app/(site)/layout.tsx"` matches
- [ ] `grep -n "min-h-screen" components/layout/MainChrome.tsx` — no matches
- [ ] `grep -n "flex-1" components/layout/MainChrome.tsx` matches
- [ ] `grep -n "sticky" components/layout/Footer.tsx` — no matches
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, same count as baseline
- [ ] `pnpm build` exits 0
- [ ] Manual check (Step 5) confirms no gap on `/contact`, `/privacy`,
      `/terms` at desktop width, and no regression on `/` and `/portfolio`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the three in-scope files doesn't match the "Current state"
  excerpts above (drift since this plan was written).
- After Step 1–3, the manual check in Step 5 still shows a gap on
  `/contact` — this would mean an assumption about the flex layout
  algorithm was wrong; report the actual rendered behavior (with a
  screenshot or computed-style dump of `<main>`'s and `<footer>`'s
  bounding boxes) rather than guessing at further CSS changes.
- `pnpm build` fails after these changes in a way that traces to the
  layout restructuring (as opposed to an unrelated pre-existing issue) —
  report the build error.
- You find a test that specifically asserts on `Footer`'s or
  `MainChrome`'s class list (e.g. a snapshot test) — update it only if its
  sole purpose is asserting the exact class string being changed here;
  if it's testing something else entirely that happens to touch these
  classes, STOP and report instead of editing test expectations blindly.

## Maintenance notes

- Any future full-bleed/full-viewport section added to a page (like the
  homepage Hero) should stay `min-h-screen` on its own `<section>`, not on
  `<main>` — that pattern is intentionally page-local, not layout-global,
  and this plan doesn't change it.
- If a future design wants the footer to visually "stick" while scrolling
  past very tall pages (a genuine sticky-reveal effect, as opposed to the
  short-page gap this plan fixes), that would need to be built as a
  new, deliberate feature — not by re-adding `position: sticky` here,
  since that's exactly the combination that caused this bug.
- A reviewer should spot-check that `MainChrome`'s alert-dependent margin
  classes (`mt-27 lg:mt-43` / `mt-16 lg:mt-32`) were preserved exactly —
  they compensate for the `fixed` Header's height and are unrelated to
  this fix; an accidental change there would silently break header
  clearance on every page.
