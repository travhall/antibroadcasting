# Plan 032: Remove stale git worktree and scope vitest away from it

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git worktree list` and
> `git diff --stat 04e5bf8..HEAD -- vitest.config.ts`
> If `vitest.config.ts` changed since this plan was written, or the
> worktree described below is gone or points at a different commit, compare
> against the "Current state" section before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `04e5bf8`, 2026-09-04

## Why this matters

`git worktree list` shows a second worktree checked out at
`.claude/worktrees/modest-lehmann-28e1ff`, detached at commit `ed4c7d1`
(three commits behind `main`'s `04e5bf8`) — a leftover from a previous
plan-execution session that was never cleaned up. Because
`vitest.config.ts` has no `test.exclude` and vitest's own default excludes
only cover things like `node_modules` and `dist` (not arbitrary nested
worktrees), running `pnpm test` from the repo root also discovers and runs
the same 5 test files a second time from inside that worktree — reporting
"10 test files / 42 tests" instead of the real "5 test files / ~21 tests."
This isn't just cosmetic: it's exactly why a prior status note in
`plans/README.md` recorded "88/88 passed, 17 files" as of 2026-08-24 — that
number was doubled (or worse, given multiple worktrees may have existed at
different times) by the same bug, so historical test-count figures in this
repo's own audit trail have been unreliable. Removing the stale worktree
fixes today's double-count; adding a `test.exclude` in `vitest.config.ts`
prevents any *future* worktree (under `.claude/worktrees/` or elsewhere)
from silently doing the same thing again.

## Current state

- `git worktree list` output at time of writing:
  ```
  /Users/travishall/GitHub/antibroadcasting                                          04e5bf8 [main]
  /Users/travishall/GitHub/antibroadcasting/.claude/worktrees/modest-lehmann-28e1ff  ed4c7d1 (detached HEAD)
  ```
- `git -C .claude/worktrees/modest-lehmann-28e1ff status` reports a clean
  working tree (no uncommitted changes) — safe to remove, nothing unique
  would be lost.
- `.claude` is itself gitignored (see `.gitignore`), so this worktree isn't
  tracked by git in any parent-repo sense; it's pure local disk clutter
  that also happens to confuse vitest's file discovery.
- `vitest.config.ts` in full, as it exists today:
  ```ts
  import { defineConfig } from "vitest/config";
  import path from "node:path";

  export default defineConfig({
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    test: {
      environment: "node",
    },
  });
  ```
  No `test.exclude` key exists yet.
- The real, canonical test files (confirm this list is unchanged with
  `find . \( -name "*.test.ts" -o -name "*.test.tsx" \) -not -path "*/node_modules/*" -not -path "*/.claude/*"`):
  - `lib/quote-request-schema.test.ts`
  - `app/api/send/route.test.ts`
  - `lib/emails/QuoteNotificationEmail.test.tsx`
  - `lib/emails/QuoteConfirmationEmail.test.tsx`
  - `lib/emails/BrandedEmailLayout.test.tsx`

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|---------------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`        | exit 0, no errors   |
| Lint      | `pnpm lint`                     | exit 0               |
| Tests     | `pnpm test`                     | 5 test files, ~21 tests, all pass |

## Scope

**In scope** (the only files/paths you should modify):
- `vitest.config.ts` (add `test.exclude`)
- Removing the worktree at `.claude/worktrees/modest-lehmann-28e1ff` via
  `git worktree remove` (a git-metadata operation, not a source-file edit,
  but it's an action this plan authorizes explicitly)

**Out of scope** (do NOT touch, even though they look related):
- Any other worktree that may exist by the time you run this (check
  `git worktree list` fresh — if there's more than the one described
  above, or a different one, STOP and report rather than removing
  something you don't have context on).
- `.gitignore` — already correctly excludes `.claude`; no change needed
  there.
- The 5 real test files themselves — this plan is about discovery scope,
  not test content.

## Git workflow

- Branch: none required — small, low-risk fix; commit directly.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `chore: exclude nested worktrees from vitest
  discovery`.
- Do NOT push unless the operator instructed it.
- Note: removing a git worktree is a local filesystem/metadata operation,
  not something that shows up in `git status` or gets committed — do it as
  Step 1, then commit only the `vitest.config.ts` change afterward.

## Steps

### Step 1: Remove the stale worktree

```
git worktree remove .claude/worktrees/modest-lehmann-28e1ff
```

**Verify**: `git worktree list` → only the main working tree is listed
(the `modest-lehmann-28e1ff` row is gone). Also confirm the directory
itself is gone: `test -d .claude/worktrees/modest-lehmann-28e1ff && echo STILL THERE || echo REMOVED` → prints `REMOVED`.

If `git worktree remove` refuses because of untracked files inside it,
re-run `git -C .claude/worktrees/modest-lehmann-28e1ff status` first to see
what's there — do not force-remove blindly; report what the untracked
files are if any exist (the recon for this plan found none, so this should
not happen, but the codebase may have drifted).

### Step 2: Add `test.exclude` to `vitest.config.ts`

Update the `test` block to add an `exclude` array. Match vitest's own
documented default exclude list (so you're extending it, not replacing
useful defaults) plus the worktrees path:

```ts
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/.claude/**",
    ],
  },
});
```

**Verify**: `grep -n "\.claude" vitest.config.ts` returns a match.

### Step 3: Confirm the fix with a real test run

**Verify**: `pnpm test` → reports exactly **5 test files** and the tests
within them (not 10 files) — read the vitest summary line at the end of
output to confirm the file count, and confirm all pass.

## Test plan

No new test files — this plan fixes test *discovery*, not test *content*.
The verification is the test run itself: file count must drop from the
buggy doubled count back to the real 5.

**Verify**: `pnpm test` → "Test Files  5 passed (5)" (or whatever the real
current file count is if it has changed since this plan was written — cross-
check against the `find` command in "Current state" above rather than
assuming exactly 5 if the codebase has drifted).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `git worktree list` shows only the main working tree
- [ ] `grep -n "\.claude" vitest.config.ts` returns a match
- [ ] `pnpm test` reports a test-file count equal to the real count from
      `find . \( -name "*.test.ts" -o -name "*.test.tsx" \) -not -path "*/node_modules/*" -not -path "*/.claude/*" | wc -l`
      (not double it)
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `git worktree list` shows a *different* worktree than the one described
  (different name, different commit, or more than one extra worktree) —
  someone may be actively using it; don't remove something you can't
  confirm is stale and clean.
- `git -C .claude/worktrees/modest-lehmann-28e1ff status` (run *before*
  removing it, if it still exists) shows uncommitted changes — STOP and
  report what they are rather than discarding someone's in-progress work.
- After adding `test.exclude`, `pnpm test` still reports more test files
  than the real count from the `find` command above — that would mean
  there's a second source of duplication this plan didn't anticipate;
  report the actual file list vitest is discovering
  (`pnpm test -- --reporter=verbose` or equivalent) rather than guessing
  at another fix.

## Maintenance notes

- Anyone spawning future worktrees for plan execution (this repo's own
  `improve`-skill `execute` variant does this) should still avoid nesting
  them under a path vitest might discover — `.claude/worktrees/` is now
  covered by the new exclude, but a worktree created elsewhere in the repo
  tree would not be. Prefer keeping worktrees under `.claude/worktrees/` or
  another already-excluded path going forward.
- A reviewer should sanity-check the `pnpm test` file count against
  whatever the real, current number of `*.test.ts(x)` files is at review
  time — it will keep changing as the suite grows, but it should never
  again be an exact multiple of a smaller "real" count.
