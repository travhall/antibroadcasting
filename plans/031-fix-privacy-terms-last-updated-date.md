# Plan 031: Fix "Last updated" showing today's date on Privacy/Terms pages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 04e5bf8..HEAD -- "app/(site)/privacy/page.tsx" "app/(site)/terms/page.tsx"`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `04e5bf8`, 2026-09-04

## Why this matters

Both `app/(site)/privacy/page.tsx` and `app/(site)/terms/page.tsx` render
their "Last updated" line with `new Date().toLocaleDateString(...)` — the
*current* date, evaluated wherever/whenever the component renders. Neither
page opts into dynamic rendering, so under Next.js App Router's default
static rendering these are prerendered once per build: the displayed date
is really "the date this app was last built," and it silently drifts to
today's date on every redeploy — even when the legal text hasn't changed at
all. That's misleading to site visitors (it implies these policies are
being actively revised on some cadence they aren't) and, since these are
policy pages, sloppy in a way that could matter if the wording is ever
scrutinized. The fix is a constant, not a system: hardcode the real date
these pages' content was last substantively written, and leave a comment
telling future editors to bump it by hand when they actually change the
copy.

## Current state

- `app/(site)/privacy/page.tsx:19-26`:
  ```tsx
  <p className="text-text-muted mb-6">
    Last updated:{" "}
    {new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}
  </p>
  ```
- `app/(site)/terms/page.tsx:18-25` — identical pattern:
  ```tsx
  <p className="text-text-muted mb-6">
    Last updated:{" "}
    {new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}
  </p>
  ```
- Both pages are plain server components: no `"use client"`, no
  `export const dynamic = "force-dynamic"`, no `revalidate` export — so
  Next.js statically renders them at build time by default, confirming the
  date is a build-time snapshot, not a true "today" value.
- Neither file currently imports anything date-related beyond the inline
  `new Date()` call — no existing date-formatting utility elsewhere in
  `lib/` to reuse; a small local constant per file is the right size fix
  here.
- Git history for the *content* of these pages (not styling) shows the
  actual last substantive edit was commit `5f6698e`, "feat: add privacy and
  terms pages with footer updates", dated **2026-04-27**
  (`git log -1 --format=%cd --date=short 5f6698e`). The only commit since
  then touching these files, `04e5bf8`, was a text-color styling tweak
  ("style: update text colors for consistency across privacy and terms
  pages") — not a content change, so it should not be used as the "last
  updated" date.

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|---------------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`        | exit 0, no errors   |
| Lint      | `pnpm lint`                     | exit 0               |
| Tests     | `pnpm test`                     | all pass             |
| Build     | `pnpm build`                    | exit 0, no new/changed route errors |

## Scope

**In scope** (the only files you should modify):
- `app/(site)/privacy/page.tsx`
- `app/(site)/terms/page.tsx`

**Out of scope** (do NOT touch, even though they look related):
- The rest of the legal copy on either page — this plan is only about the
  "Last updated" date mechanism, not a content rewrite.
- `components/ui/PageBreadcrumb.tsx` or any shared layout component — both
  pages import it but it's unrelated to this bug.
- Do not add a shared `lib/` date-formatting utility for this — two
  hardcoded constants, one per page, is the right-sized fix. Do not build
  a "last updated" system, CMS field, or config option unless a human
  explicitly asks for one later.

## Git workflow

- Branch: none required — small, low-risk, single-purpose fix; commit
  directly per the repo's convention of direct commits for small fixes.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `fix: stop "Last updated" date from drifting on
  every deploy`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Replace the dynamic date in `app/(site)/privacy/page.tsx`

Replace the `{new Date().toLocaleDateString(...)}` expression (lines 21-25)
with a hardcoded string constant declared just above the component, e.g.:

```tsx
const LAST_UPDATED = "April 27, 2026";
```

placed after the `metadata` export and before `export default function
PrivacyPage()`. Then change the JSX to:

```tsx
<p className="text-text-muted mb-6">Last updated: {LAST_UPDATED}</p>
```

Add a one-line comment above the constant so future editors know to update
it by hand:

```tsx
// Bump this manually whenever the policy text below actually changes.
const LAST_UPDATED = "April 27, 2026";
```

**Verify**: `grep -n "new Date()" "app/(site)/privacy/page.tsx"` returns no
matches.

### Step 2: Apply the identical fix to `app/(site)/terms/page.tsx`

Same pattern: add the `LAST_UPDATED` constant (with the same comment and
the same date, `"April 27, 2026"`, since both pages were introduced in the
same commit) above `export default function TermsPage()`, and replace the
JSX date expression with `{LAST_UPDATED}`.

**Verify**: `grep -n "new Date()" "app/(site)/terms/page.tsx"` returns no
matches.

### Step 3: Confirm both pages still render correct static content

**Verify**: `pnpm build` → exit 0, and the build output lists `/privacy`
and `/terms` as static (`○`) routes, same as before this change (confirm
by comparing against a pre-change `pnpm build` run if unsure, or simply
checking the two routes appear with the static marker in this build's
route summary).

## Test plan

No existing test file covers these pages, and neither page has meaningful
logic left to unit-test after this change (it's a hardcoded string in JSX).
No new tests are needed — this is a `render text != now()` bug, not a
behavior that benefits from a regression test. If a future editor wants
coverage here, the pattern to follow would be a simple render test using
whatever the repo's component-testing convention becomes (none currently
exists for page-level components — `lib/quote-request-schema.test.ts` and
the `lib/emails/*.test.tsx` files test pure functions and email templates,
not page components, so there's no existing pattern to match yet).

Run the full suite once as a regression check:

**Verify**: `pnpm test` → all existing tests still pass (no page-level
tests should appear or be expected).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "new Date()" "app/(site)/privacy/page.tsx" "app/(site)/terms/page.tsx"` returns no matches
- [ ] `grep -n "LAST_UPDATED" "app/(site)/privacy/page.tsx"` and the same for `terms/page.tsx` both return a match
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `app/(site)/privacy/page.tsx:19-26` or
  `app/(site)/terms/page.tsx:18-25` doesn't match the excerpts above (the
  page may have been edited since this plan was written — re-derive the
  correct "last content change" date from `git log` for the changed file
  rather than assuming `2026-04-27` still applies, and report what you
  found instead of guessing).
- Either page has since gained `"use client"` or a `dynamic`/`revalidate`
  export that changes its rendering mode — that would change the nature of
  the bug and this plan's fix might no longer be the right one; report
  before proceeding.

## Maintenance notes

- The `LAST_UPDATED` constants are now the source of truth for these two
  dates. Whoever edits the legal copy on either page in the future is
  responsible for bumping the corresponding constant by hand — the inline
  comment added in Steps 1-2 exists to remind them.
- If this site later grows a real CMS-driven legal-copy workflow (Keystatic
  already manages other content types — see `keystatic.config.ts`), a
  future improvement could move these pages' content and date into
  Keystatic collections. Out of scope here; flagged only so a reviewer
  doesn't mistake the hardcoded constant for the final word on how this
  should work forever.
