# Plan 030: Stop gitignoring `plans/` and commit its existing history

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 04e5bf8..HEAD -- .gitignore plans/`
> If `.gitignore` or any file under `plans/` changed since this plan was
> written, compare the "Current state" excerpts against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `04e5bf8`, 2026-09-04

## Why this matters

`plans/` holds this repo's entire `improve`-skill audit history: 29 numbered
plan files plus `plans/README.md`, which doubles as a launch checklist,
a decision log (mailbox provider, domain strategy, Keystatic storage mode),
and a record of what's actually landed on `main` vs. what's still pending.
None of it is tracked by git — a line in `.gitignore` excludes the whole
directory, and it has never been committed. If this machine is lost, the
disk fails, or a fresh clone is ever made, that entire history disappears
with no way to reconstruct it. This is a one-line fix: remove the ignore
rule and commit what already exists on disk.

## Current state

- `.gitignore` — the exclusion rule, on the file's last line:
  ```
  # typescript
  *.tsbuildinfo
  next-env.d.ts
  .playwright-mcp
  plans
  ```
  (`plans` is the last line, with no trailing newline — confirm with
  `tail -c 20 .gitignore` before editing so you match the exact bytes.)
- `plans/README.md` and `plans/0*.md` — 29 plan files plus the index, all
  present on disk, all currently untracked. Confirm with:
  `git status --porcelain --ignored plans/ | head -5` → every line should
  currently start with `!!` (ignored), not `??` (untracked-but-visible),
  proving they're being suppressed by the gitignore rule rather than
  merely un-added.
- No other tooling depends on `plans/` being ignored — it's not a build
  output directory (`.next/`, `/out/`, `/build` are the real build-output
  entries elsewhere in `.gitignore` and are correctly separate).

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|---------------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`        | exit 0, no errors   |
| Lint      | `pnpm lint`                     | exit 0               |
| Tests     | `pnpm test`                     | all pass             |

(This plan touches no source code, so these gates should be unaffected —
run them anyway to confirm nothing else broke in the working tree.)

## Scope

**In scope** (the only files you should modify):
- `.gitignore` (remove the `plans` line)
- `plans/` (git-add everything currently on disk under this directory)

**Out of scope** (do NOT touch, even though they look related):
- `.claude` — also gitignored, but that's local agent config, not project
  history. Leave it ignored.
- Any content *inside* the existing plan files. This plan is about git
  tracking, not editing plan content — don't "clean up" or reword old
  entries while you're in there.

## Git workflow

- Branch: none required — this is a small, low-risk change; commit directly
  per the repo's observed convention of direct commits for small fixes (see
  `git log --oneline -10` for message style, e.g. `fix: ...`, `chore: ...`).
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `chore: track plans/ directory in git`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Remove the `plans` line from `.gitignore`

Open `.gitignore` and delete the line containing exactly `plans` (currently
the last line in the file, no trailing newline after it — when you delete
it, make sure the preceding line, `.playwright-mcp`, ends with a newline so
the file stays well-formed).

**Verify**: `git check-ignore -v plans/README.md` → outputs nothing and
exits with status 1 (meaning the path is no longer ignored).

### Step 2: Stage and commit the plans directory

```
git add .gitignore plans/
git status --porcelain
```

**Verify**: `git status --porcelain` shows `plans/README.md` and every
`plans/0*.md` file as staged additions (`A ` prefix), plus the modified
`.gitignore` (`M `). Count them: `git status --porcelain plans/ | wc -l`
should equal the file count from `find plans/ -type f | wc -l`.

Then commit:

```
git commit -m "chore: track plans/ directory in git

The improve-skill audit history (29 plan files + README, tracking launch
checklist and past decisions) was being silently excluded by .gitignore
and had never been committed — existed only on one machine with no backup."
```

**Verify**: `git log -1 --stat` shows the commit with `plans/` files listed,
and `git status` reports a clean working tree (or only unrelated changes,
if any existed before this plan started).

## Test plan

No new tests — this plan changes git tracking, not application behavior.
The existing suite (`pnpm test`) should be unaffected; run it once after
committing purely as a regression check that nothing else in the working
tree was disturbed.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `git check-ignore -v plans/README.md` exits 1 (not ignored)
- [ ] `git ls-files plans/ | wc -l` equals `find plans/ -type f | wc -l`
      (every file on disk under `plans/` is now tracked)
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `plans/README.md` status row for this plan updated

## STOP conditions

Stop and report back (do not improvise) if:

- `.gitignore` doesn't contain a bare `plans` line matching what's described
  above (someone may have already partially fixed this — check
  `git log -p -- .gitignore | grep -A2 -B2 plans` for recent related
  changes before assuming the plan is stale).
- Any file under `plans/` looks like it contains a real secret value (API
  key, password, token) rather than a `file:line` reference to one — if so,
  STOP before committing and report which file/line, since committing a
  secret into git history is much harder to undo than leaving it untracked.
- `git status --porcelain plans/` shows anything you don't recognize as an
  existing plan file (e.g. a `.DS_Store` or editor swap file) — exclude
  those from the `git add`, don't commit incidental clutter.

## Maintenance notes

- Going forward, any `improve`-skill run (including future ones) should
  write plans directly into the now-tracked `plans/` directory — no special
  handling needed, it behaves like any other tracked directory.
- A reviewer should confirm no secret values got swept into the commit by
  the broad `git add plans/` — skim `git show --stat` and spot-check a few
  files, especially `plans/README.md` since it's the most narrative one.
- This plan intentionally does not touch `.claude` in `.gitignore` — that
  exclusion is correct and unrelated (local machine config, not project
  history).
