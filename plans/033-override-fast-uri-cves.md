# Plan 033: Override transitive `fast-uri` to patch 4 high-severity CVEs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 04e5bf8..HEAD -- pnpm-workspace.yaml package.json` and re-run `pnpm audit`.
> If `pnpm-workspace.yaml` changed, or `pnpm audit` no longer reports
> `fast-uri` advisories, compare against the "Current state" section before
> proceeding — the vulnerability may already be fixed by an unrelated
> dependency bump; treat either case as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dependencies
- **Planned at**: commit `04e5bf8`, 2026-09-04

## Why this matters

`pnpm audit` currently reports 4 high-severity CVEs in `fast-uri@3.1.5`
(host-confusion/SSRF advisories `GHSA-5jgf-p345-68v8`,
`GHSA-fph4-wmhf-6fwf`, `GHSA-jqff-g426-hqxp`, and one more in the same
family — all fixed in `fast-uri@>=3.1.6`). `fast-uri` is not a direct
dependency; it's pulled in transitively, twice, via `ajv` schema
validation used only by **build-time tooling**, never by code that runs in
the deployed app:

1. `@sentry/nextjs` (a real `dependencies` entry) → `@sentry/webpack-plugin`
   → `webpack`'s `minimizer-webpack-plugin` → `schema-utils` → `ajv` /
   `ajv-formats` / `ajv-keywords` → `fast-uri`. This chain only executes
   inside Sentry's webpack plugin during `next build` (source-map upload
   config validation) — it is not part of the code Next.js ships to the
   server or client runtime.
2. `react-email` (a `devDependencies` entry, used only by the local
   `email:dev` preview script) → `conf` → `ajv` / `ajv-formats` →
   `fast-uri`.

So the practical exploitability here is low — `fast-uri`'s SSRF-via-URL-
resolution bugs matter when *untrusted* input reaches its `resolve()`, and
neither chain does that with attacker-controlled data. Still, `pnpm audit`
will keep flagging this repo as having "4 high" vulnerabilities until it's
fixed, which is noise that could bury a future *real* high-severity
finding. The fix is a version override, not a dependency change — this
repo already uses `pnpm.overrides` in `pnpm-workspace.yaml` for exactly
this kind of transitive pin (see the existing `postcss`, `rolldown`, and
`electron-to-chromium` entries). Add one more line following the same
pattern.

## Current state

- `pnpm-workspace.yaml` in full, as it exists today:
  ```yaml
  allowBuilds:
    '@sentry/cli': false
    esbuild: true
    sharp: true
    ttf2woff2: true
    unrs-resolver: true

  overrides:
    postcss: ">=8.5.10"
    "@napi-rs/wasm-runtime": "1.1.5"
    electron-to-chromium: "1.5.377"
    node-releases: "2.0.48"
    rolldown: "1.1.2"
    "@rolldown/binding-android-arm64": "1.1.2"
    "@rolldown/binding-darwin-arm64": "1.1.2"
    "@rolldown/binding-darwin-x64": "1.1.2"
    "@rolldown/binding-freebsd-x64": "1.1.2"
    "@rolldown/binding-linux-arm-gnueabihf": "1.1.2"
    "@rolldown/binding-linux-arm64-gnu": "1.1.2"
    "@rolldown/binding-linux-arm64-musl": "1.1.2"
    "@rolldown/binding-linux-ppc64-gnu": "1.1.2"
    "@rolldown/binding-linux-s390x-gnu": "1.1.2"
    "@rolldown/binding-linux-x64-gnu": "1.1.2"
    "@rolldown/binding-linux-x64-musl": "1.1.2"
    "@rolldown/binding-openharmony-arm64": "1.1.2"
    "@rolldown/binding-wasm32-wasi": "1.1.2"
    "@rolldown/binding-win32-arm64-msvc": "1.1.2"
    "@rolldown/binding-win32-x64-msvc": "1.1.2"
  ```
  Note the `postcss` entry's style (`">=8.5.10"`, a range, not a pin) —
  that's the convention to follow for this fix, since we want "at least the
  patched version" rather than pinning to one exact release.
- `pnpm why fast-uri` confirms both chains land on the same vulnerable
  `fast-uri@3.1.5`, and that no direct `dependencies`/`devDependencies`
  entry in `package.json` names `fast-uri`, `ajv`, `schema-utils`, or
  `conf` — this must be fixed via `overrides`, there is no direct version
  bump available.
- `pnpm audit` output at time of writing (severity/title only, values
  confirmed but not reproduced verbatim beyond what's needed to identify
  the advisories):
  - `GHSA-5jgf-p345-68v8` — high — host confusion via skipped IDN
    canonicalization
  - `GHSA-fph4-wmhf-6fwf` — high — SSRF via repeated hostname
    percent-decoding
  - `GHSA-jqff-g426-hqxp` — high — host confusion via percent-encoded
    scheme normalization
  - (a fourth high-severity advisory in the same `fast-uri` package,
    confirm the full current list with `pnpm audit` rather than assuming
    exactly these four if the codebase has drifted)
  - All list `patched_versions: ">=3.1.6"`.

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|---------------------------------|---------------------|
| Install   | `pnpm install`                  | exit 0, lockfile updated |
| Audit     | `pnpm audit`                    | no `fast-uri` advisories listed |
| Typecheck | `pnpm exec tsc --noEmit`        | exit 0, no errors   |
| Lint      | `pnpm lint`                     | exit 0               |
| Tests     | `pnpm test`                     | all pass             |
| Build     | `pnpm build`                    | exit 0               |

## Scope

**In scope** (the only files you should modify):
- `pnpm-workspace.yaml` (add the `fast-uri` override)
- `pnpm-lock.yaml` (regenerated automatically by `pnpm install` — do not
  hand-edit it)

**Out of scope** (do NOT touch, even though they look related):
- `package.json` dependencies/devDependencies — `fast-uri` is not a direct
  dependency and must not become one; this is purely a transitive-version
  override.
- Any other entry already in `overrides` — don't touch, reorder, or
  "clean up" the existing pins while you're in the file.
- Do not attempt to remove or replace `@sentry/nextjs` or `react-email` to
  dodge this transitively — that would be a much larger, unrelated change
  for a low-severity, build-tooling-only issue.

## Git workflow

- Branch: none required — small, low-risk fix; commit directly.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `chore: override transitive fast-uri to patch
  high-severity CVEs`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Add the `fast-uri` override

In `pnpm-workspace.yaml`, add a new line under `overrides:`, matching the
existing `postcss` entry's range style:

```yaml
overrides:
  postcss: ">=8.5.10"
  "fast-uri": ">=3.1.6"
  "@napi-rs/wasm-runtime": "1.1.5"
  ...
```

(Insert it anywhere in the `overrides` map — alphabetical/grouping order is
not currently enforced by the existing file, so placement right after
`postcss` is fine.)

**Verify**: `grep -n "fast-uri" pnpm-workspace.yaml` returns a match.

### Step 2: Reinstall to regenerate the lockfile

```
pnpm install
```

**Verify**: exit 0, and `pnpm why fast-uri` now shows `fast-uri 3.1.6` (or
higher) at every occurrence in both the `@sentry/nextjs` chain and the
`react-email` chain — not `3.1.5`.

### Step 3: Confirm the vulnerabilities are gone

**Verify**: `pnpm audit` → no advisories mentioning `fast-uri` in the
output (there may still be zero, some, or different advisories for
*other* packages — this plan only claims to fix the `fast-uri` ones;
report but do not attempt to fix any unrelated advisory that appears).

### Step 4: Full verification sweep

Run all of: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.

**Verify**: all four exit 0. This confirms the override didn't break
Sentry's build-time source-map tooling or react-email's dev CLI (neither
of which this plan can directly exercise via the test suite, since both
are build/dev-time-only — the build and typecheck passing is the
practical signal that the override didn't break resolution).

## Test plan

No new tests — this is a transitive dependency version bump with no
application-code behavior change. The existing suite (`pnpm test`) and a
full `pnpm build` together serve as the regression check: if the override
broke module resolution anywhere in the `ajv`/`schema-utils`/`webpack`
chain, `pnpm build` (which invokes the Sentry webpack plugin) would fail.

**Verify**: `pnpm test` → all existing tests pass, no count change from
before this plan (this plan doesn't touch test files). `pnpm build` →
exit 0.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "fast-uri" pnpm-workspace.yaml` returns a match with a
      version range of `>=3.1.6` or higher
- [ ] `pnpm why fast-uri` shows no occurrence of `3.1.5` or any version
      below `3.1.6`
- [ ] `pnpm audit` output contains no `fast-uri` advisories
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] No files outside the in-scope list are modified except
      `pnpm-lock.yaml` (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm install` fails to resolve with the override in place (a peer-
  dependency conflict between the pinned `fast-uri` version and something
  `ajv`/`schema-utils` requires) — report the exact `pnpm install` error
  rather than trying alternate version ranges.
- After the override, `pnpm build` fails in a way that traces to Sentry's
  webpack plugin or source-map upload step — that would suggest the
  override broke something real inside build tooling; report the build
  error rather than reverting silently or trying to patch around it.
- `pnpm audit` still lists a `fast-uri` advisory after Step 2 — check
  whether a *third*, undiscovered dependency chain is pulling in an older
  `fast-uri` that the override isn't catching (unlikely, since `pnpm`
  overrides apply repo-wide, but report the full `pnpm why fast-uri`
  output if this happens rather than guessing at another fix).

## Maintenance notes

- This override should be revisited (and can likely be removed) once
  either `@sentry/nextjs`'s bundled `@sentry/webpack-plugin` or
  `react-email`'s `conf` dependency naturally upgrades past a `fast-uri`
  version that needs pinning — future `pnpm audit` runs will simply stop
  flagging it once the upstream packages catch up, at which point the
  override becomes a no-op that's safe to delete during a routine
  dependency-cleanup pass.
- A reviewer should not need to re-verify the SSRF/host-confusion
  reasoning in "Why this matters" beyond confirming the two dependency
  chains above are still build-time-only (i.e., no new code path has
  started passing untrusted, attacker-controlled URLs through
  `ajv`/`fast-uri` at runtime) — if such a path is ever added, this
  become a real runtime finding, not just an audit-noise cleanup.
