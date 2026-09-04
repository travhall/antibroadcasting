# Plan 026 (spike): Investigate and scaffold GitHub-mode Keystatic storage

> **Executor instructions**: This is a **spike**, not a full feature build —
> the deliverable is a written recommendation doc plus a small, safe,
> reversible code scaffold. It does NOT flip the site over to GitHub-mode
> storage in production; that requires the site owner to create a GitHub
> OAuth App and set real secrets, which is outside what an executor can do.
> Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the
> "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 25b2392..HEAD -- keystatic.config.ts .env.local`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live files before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P3 (direction/spike — not a bug, no urgency, but high
  potential leverage; see "Why this matters")
- **Effort**: S (spike + safe scaffold only — the real migration is
  operator work, out of scope here)
- **Risk**: LOW (the code scaffold is inert unless three specific env vars
  are set, which nothing in this repo or its deploy currently sets)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `25b2392`, 2026-08-09

## Why this matters

`keystatic.config.ts:4-6` hardcodes `storage: { kind: "local" }`. In this
mode, every content edit through `/keystatic` writes directly to JSON files
on whatever filesystem is running the Next.js process. On Vercel's serverless
functions that filesystem is ephemeral and effectively read-only between
invocations — so today, the only way to actually change site content is:
run `pnpm dev` on a developer's machine, edit through the local admin UI
(which writes to `content/*.json` in the working tree), then `git commit` +
push + let Vercel redeploy. This is exactly the "limited capacity, high
degree of specificity" workflow described when this audit was requested.

Keystatic's **GitHub-mode** storage (`storage: { kind: "github", repo: {...} }`)
changes this fundamentally: the admin UI, running on the *deployed* site,
reads and writes content by committing directly to the GitHub repo via the
GitHub API (through a GitHub OAuth App), instead of touching the local
filesystem. An editor could then open `https://antibroadcasting.com/keystatic`
directly, make a change, and have it land as a real commit — no local dev
environment, no manual redeploy step (Vercel's existing git integration
already redeploys on push). This is the single highest-leverage change
available to "expand Keystatic's capabilities," and there's already a signal
the site owner considered it: `.env.local:12-14` has `KEYSTATIC_GITHUB_CLIENT_ID`,
`KEYSTATIC_GITHUB_CLIENT_SECRET`, and `KEYSTATIC_SECRET` present as commented-
out placeholders — exactly the three environment variables GitHub-mode needs
(confirmed by reading the installed `@keystatic/core@0.6.4` source directly;
see "Current state").

As a side effect, this also closes a gap `plans/README.md:136-143` already
flagged and explicitly accepted as non-blocking for launch: "Keystatic admin
runs in local storage mode with no auth layer of its own... whoever can edit
content is whoever knows the URL." GitHub-mode requires a real GitHub OAuth
login to write anything — the admin UI would still be reachable by anyone,
but only a GitHub account with write access to the repo could actually save
a change.

This plan does **not** implement the cutover — creating the GitHub OAuth App,
generating its client secret, and setting real environment variables in
Vercel are actions only the site owner (repo admin on GitHub, project admin
on Vercel) can take, and none of them should be guessed or automated by an
executor. Instead, this plan produces (1) a written decision doc laying out
exactly what's required and what changes for the editing workflow, and (2)
a minimal code scaffold that's inert today and activates automatically the
moment the real secrets are set — so the actual cutover, when the owner is
ready, is "set three env vars in Vercel," not "write and review new code."

## Current state

`keystatic.config.ts:1-6` — current storage config, full relevant excerpt:

```ts
import { config, collection, singleton, fields } from "@keystatic/core";

export default config({
  storage: {
    kind: "local",
  },
  // ...
```

`.env.local:10-14` (variable **names** only — this plan must never read or
reproduce their values, and per repo convention `.env.local` itself is
git-ignored and never committed):

```
# KEYSTATIC_GITHUB_CLIENT_ID=
# KEYSTATIC_GITHUB_CLIENT_SECRET=
# KEYSTATIC_SECRET=
```

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/declarations/src/config.d.ts`
confirms the storage type accepted by `config()`:

```ts
type GitHubStorageConfig = {
  kind: 'github';
  repo: RepoConfig; // `${string}/${string}` | { owner: string; name: string }
} & { pathPrefix?: string; branchPrefix?: string };

type LocalStorageConfig = { kind: 'local' };

export declare function config<Collections, Singletons>(
  config: { storage: LocalStorageConfig | GitHubStorageConfig | CloudStorageConfig; /* ... */ }
): Config<Collections, Singletons>;
```

`storage` is typed as a plain union (not per-overload discrimination), so a
conditional expression that resolves to either shape type-checks fine.

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/keystatic-core-api-generic.js:74-90`
confirms the API route handler (`app/api/keystatic/[...params]/route.ts`,
already using `makeRouteHandler({ config: keystatic })` — unchanged by this
plan) automatically reads `process.env.KEYSTATIC_GITHUB_CLIENT_ID`,
`process.env.KEYSTATIC_GITHUB_CLIENT_SECRET`, and `process.env.KEYSTATIC_SECRET`
for GitHub-mode's OAuth flow — no route-handler code change is needed, only
the `storage` config and the real env var values.

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/keystatic-core-api-generic.js:27-28`
confirms `KEYSTATIC_SECRET must be at least 32 characters long` is enforced
at runtime — the decision doc (Step 1) must tell the site owner this.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Build     | `pnpm build`               | exit 0              |
| Tests     | `pnpm test`                | all pass            |

## Scope

**In scope**:
- `docs/keystatic-github-mode-migration.md` (new — the decision doc)
- `keystatic.config.ts` (a minimal, env-gated conditional — see Step 2)
- `.env.local` (adding the three variable names as commented-out
  placeholders, if not already present exactly as shown in "Current state" —
  they already are, so this file likely needs no edit; confirm, don't assume)

**Out of scope** (do NOT do these — they require the site owner, not an
executor):
- Creating a GitHub OAuth App on github.com.
- Generating or setting real values for `KEYSTATIC_GITHUB_CLIENT_ID`,
  `KEYSTATIC_GITHUB_CLIENT_SECRET`, or `KEYSTATIC_SECRET` anywhere (locally
  or in Vercel's project settings).
- Actually testing the GitHub-mode OAuth flow end-to-end — this requires a
  real registered OAuth App with a real callback URL, which doesn't exist
  yet.
- Changing `app/api/keystatic/[...params]/route.ts` or `app/keystatic/**` —
  both already work generically for whichever storage mode is active; no
  code there is storage-mode-specific.
- Migrating `content/*.json` to a different location or format — GitHub-mode
  reads/writes the exact same repo paths as local mode; no content files
  need to move.

## Git workflow

- Branch: `advisor/026-spike-github-mode-storage-migration`
- Commit message style follows this repo's conventional-commit style seen in
  `git log` — use `docs:` for the decision doc, `feat:` for the config
  scaffold (it adds new, currently-inactive capability).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write the decision doc

Create `docs/keystatic-github-mode-migration.md` covering, in this order:

1. **What changes for editors** — today: edit locally via `pnpm dev`, commit,
   push, wait for Vercel to redeploy. After: log into
   `https://antibroadcasting.com/keystatic` with GitHub, edit directly, save
   — Keystatic commits to the repo via the GitHub API, Vercel's existing git
   integration redeploys automatically. No local dev environment needed for
   day-to-day content edits.
2. **What the site owner must do manually, in order** (do not perform any of
   these — write them as instructions for a human):
   - Create a GitHub OAuth App at `github.com/settings/developers` (repo
     owner or an org owner, scoped to the `antibroadcasting` repo/org).
     Homepage URL: `https://antibroadcasting.com`. Authorization callback
     URL: `https://antibroadcasting.com/api/keystatic/github/oauth/callback`
     (confirm this exact path against the installed `@keystatic/core`
     version's OAuth callback route before finalizing the doc — search
     `node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist`
     for the callback path string, e.g. `grep -rn "oauth/callback" <path>`,
     and use what's actually found rather than assuming).
   - Generate a client secret for that OAuth App.
   - Generate a random 32+ character string for `KEYSTATIC_SECRET` (e.g.
     `openssl rand -hex 32`).
   - Set `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`,
     `KEYSTATIC_SECRET` as **Vercel project environment variables**
     (Production, and Preview if preview-branch editing is wanted) — never
     commit real values to `.env.local` or anywhere in the repo.
   - Redeploy (or trigger a new deploy) so the new env vars take effect.
3. **What doesn't change** — content file locations/format, the collections/
   singleton schema, every page's `reader.*` calls, local `pnpm dev` still
   works exactly as before (falls back to local mode, per Step 2's scaffold)
   for anyone who prefers editing on a branch before pushing.
4. **Tradeoffs to flag explicitly**:
   - GitHub-mode edits commit directly — there's no local review step
     between an editor's save and it becoming a real commit (unless the
     owner also configures Keystatic's PR-based editing mode, which is a
     further, separate option worth a one-line mention but not detailed
     here).
   - The OAuth App's client secret and `KEYSTATIC_SECRET` are real
     credentials — treat them with the same care as any other production
     secret (Vercel env vars, never committed).
   - Every editor who should be able to publish content needs a GitHub
     account with write access to this repo (or the org, depending on how
     access is scoped) — this may be more or less friction than the current
     "knows the URL" model depending on who's expected to edit.
5. **Recommendation** — state plainly whether this is worth doing given the
   tradeoffs above, and suggest it as the natural next step once the P1/P2
   plans in this batch (021-025) have landed.

**Verify**: `test -f docs/keystatic-github-mode-migration.md && echo OK` → `OK`.

### Step 2: Add an env-gated storage scaffold to `keystatic.config.ts`

Replace:

```ts
export default config({
  storage: {
    kind: "local",
  },
```

with:

```ts
const githubStorage = process.env.KEYSTATIC_GITHUB_CLIENT_ID
  ? ({
      kind: "github",
      repo: { owner: "travhall", name: "antibroadcasting" },
    } as const)
  : null;

export default config({
  // Falls back to local storage until KEYSTATIC_GITHUB_CLIENT_ID (and the
  // other two KEYSTATIC_GITHUB_*/KEYSTATIC_SECRET env vars) are set — see
  // docs/keystatic-github-mode-migration.md before setting them.
  storage: githubStorage ?? { kind: "local" },
```

Before writing this, confirm the GitHub `owner`/`name` values against the
real repo — run `git remote get-url origin` and use the actual
`<owner>/<name>` parsed from that URL, not a guessed value. If there's no
`origin` remote configured, STOP and ask the operator for the correct
owner/repo instead of guessing.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. `grep -n "KEYSTATIC_GITHUB_CLIENT_ID" keystatic.config.ts` → 1 match.

### Step 3: Confirm the scaffold is inert in this environment

```bash
grep -n "KEYSTATIC_GITHUB_CLIENT_ID" .env.local
```

**Verify**: the line is either absent or commented out (`# KEYSTATIC_GITHUB_CLIENT_ID=...`)
— confirming `process.env.KEYSTATIC_GITHUB_CLIENT_ID` is `undefined` in this
environment, so `githubStorage` evaluates to `null` and `storage` falls back
to `{ kind: "local" }`, identical to today's behavior.

### Step 4: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
```

**Verify**: all three exit 0. `pnpm build` succeeding with the scaffold in
place (and no real GitHub env vars set) proves the change is behaviorally a
no-op today — the same local-storage build that ran before this plan.

## Test plan

No new automated tests — this plan produces documentation plus a config
scaffold that is provably inert without real secrets (Step 3). There is no
way to test the actual GitHub OAuth flow without a real registered OAuth App
and real secrets, which are explicitly out of scope for an executor to
create.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `docs/keystatic-github-mode-migration.md` exists and covers all 5
  numbered sections from Step 1
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -n "KEYSTATIC_GITHUB_CLIENT_ID" keystatic.config.ts` returns 1 match
- [ ] No real secret values appear anywhere in the diff (`git diff` — every
  credential-shaped string must be a placeholder, an env var *name*, or
  absent entirely)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- There is no `origin` git remote, or its owner/repo doesn't match what
  "Current state" assumes — ask the operator for the correct values rather
  than guessing at Step 2's `repo: { owner, name }`.
- The OAuth callback path search in Step 1 (item 2) doesn't find a match in
  the installed `@keystatic/core` source — write the doc's callback-URL
  instruction as "confirm the exact callback path against Keystatic's GitHub
  storage documentation at the time of setup" instead of asserting a
  specific path you couldn't verify.
- Any step tempts you toward creating real credentials, calling the GitHub
  API, or setting real environment variables anywhere (including Vercel) —
  that is explicitly out-of-scope operator work; stop and note it in the doc
  as a manual next step instead.

## Maintenance notes

- When the site owner is ready to cut over, the only required actions are
  the manual steps in the decision doc's section 2 — no further code change
  should be needed given this plan's scaffold.
- If GitHub-mode is adopted, `plans/README.md`'s "Accepted, not a launch
  blocker" note about Keystatic having no auth layer (`plans/README.md:136-143`)
  should be updated to reflect that GitHub OAuth now gates writes.
- If the repo is ever renamed or transferred to a different GitHub owner,
  the hardcoded `repo: { owner, name }` in `keystatic.config.ts` must be
  updated to match.
