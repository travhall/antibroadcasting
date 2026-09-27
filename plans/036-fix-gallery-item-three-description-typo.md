# Plan 036: Fix mismatched description on gallery item three

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0dc6441..HEAD -- content/gallery/gallery-item-number-three.json`
> If it changed since this plan was written, compare the "Current state"
> excerpt below against the live file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug (content)
- **Planned at**: commit `0dc6441`, 2026-09-27

## Why this matters

While verifying an external site audit's finding that the Portfolio page
still shows placeholder data (confirmed, and separately being replaced
with real photography/copy — see "Maintenance notes"), a copy-paste
inconsistency was found in one placeholder entry that the audit itself
didn't catch: `content/gallery/gallery-item-number-three.json`'s
`description` field reads "This is the description for **Gallery Item
Number Two**" — wrong item number, doesn't match this file's own `title`
("Gallery Item Number Three") or `client` ("Client Three"). Every other
gallery item's placeholder description correctly references its own
number. Until the real portfolio photography/copy lands, this placeholder
content is what's actually live in the lightbox — worth a one-line fix
regardless of the bigger placeholder-replacement effort, since it's
trivial and makes the interim content internally consistent.

## Current state

`content/gallery/gallery-item-number-three.json` (full file, verified by
direct read):

```json
{
  "title": "Gallery Item Number Three",
  "client": "Client Three",
  "category": "community-organization",
  "image": "/gallery/gallery-item-number-three/image.jpg",
  "imageAlt": "",
  "featured": true,
  "description": "This is the description for Gallery Item Number Two",
  "colors": 7,
  "year": 2026
}
```

For comparison, the other four gallery items (verified by direct read) all
correctly self-reference:
- `gallery-item-number-one.json`: `"description": "This is the description for Gallery Item Number One"`
- `gallery-item-number-two.json`: `"description": "This is the description for Gallery Item Number Two"`
- `gallery-item-number-four.json`: `"description": "This is the description for Gallery Item Number Four"`
- `gallery-item-number-five.json`: `"description": "This is the description for Gallery Item Number Five"`

This content is read by a Keystatic reader in `lib/get-*.ts` (the gallery
collection reader — confirm the exact filename with
`ls lib/get-gallery*.ts` since this plan doesn't need to touch it) and
rendered in `components/ui/GalleryGrid.tsx`, `components/ui/FeaturedWorkGrid.tsx`,
and `components/ui/Lightbox.tsx`. No code changes are needed — this is a
content-file-only fix.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0 (should be unaffected — JSON content, not code) |
| Tests     | `pnpm test`               | all pass, same count as before this plan |
| Build     | `pnpm build`              | exit 0, portfolio/gallery routes still generate |

## Scope

**In scope** (the only file you should modify):
- `content/gallery/gallery-item-number-three.json`

**Out of scope** (do NOT touch, even though they look related):
- The other four `content/gallery/*.json` files — already correct, do not
  "clean up" or reformat them.
- `title`, `client`, `category`, `image`, `imageAlt`, `featured`,
  `colors`, `year` fields within `gallery-item-number-three.json` — only
  the `description` string changes.
- Any component file (`GalleryGrid.tsx`, `FeaturedWorkGrid.tsx`,
  `Lightbox.tsx`) — this is a content-only fix, no rendering logic is
  involved.
- The broader placeholder-photo/copy replacement (real client work, real
  photos) — that's a separate, content-owner-driven effort (see
  "Maintenance notes"), not something this plan attempts.

## Git workflow

- Branch: none required — trivial, single-field content fix.
- Commit message style: conventional-commit-ish, lowercase type prefix,
  imperative mood — e.g. `fix: correct mismatched description on gallery item three`.
- Do NOT push unless the operator instructed it.

## Steps

### Step 1: Fix the description field

In `content/gallery/gallery-item-number-three.json`, change:

```json
  "description": "This is the description for Gallery Item Number Two",
```

to:

```json
  "description": "This is the description for Gallery Item Number Three",
```

**Verify**: `grep -n "Gallery Item Number Three" content/gallery/gallery-item-number-three.json`
returns a match for the `description` line specifically (not just the
`title` field, which already said "Three").

### Step 2: Confirm no other file has the same class of mistake

**Verify**: `grep -H "description" content/gallery/*.json` — visually
confirm each file's description number matches its own filename/title
(one, two, three, four, five all self-consistent).

### Step 3: Full verification sweep

Run `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`.

**Verify**: all three exit 0, `pnpm test` reports the same pass count as a
pre-change baseline.

## Test plan

No new tests — this is a static content-file edit with no code path or
conditional logic affected. `pnpm build` (which statically renders the
portfolio/gallery pages at build time) is the practical regression check:
if the JSON became malformed, the build would fail on that route.

**Verify**: `pnpm build` → exit 0, and the portfolio-related routes appear
in the build output exactly as before this change (no new or missing
routes).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `content/gallery/gallery-item-number-three.json`'s `description`
      field reads exactly `"This is the description for Gallery Item Number Three"`
- [ ] `grep -c "Gallery Item Number Two" content/gallery/gallery-item-number-three.json`
      returns `0`
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0, same count as baseline
- [ ] `pnpm build` exits 0
- [ ] No files outside `content/gallery/gallery-item-number-three.json`
      are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The file's current `description` no longer says "Gallery Item Number
  Two" (i.e., it's already been fixed or changed to something else since
  this plan was written) — compare against "Current state" and report
  rather than overwriting real content that may have replaced the
  placeholder already.
- The JSON fails to parse after your edit (malformed by a stray comma or
  quote) — re-check the exact syntax against the "Current state" excerpt
  rather than guessing at a fix.

## Maintenance notes

- This entire `content/gallery/*.json` set is placeholder data pending
  real client photography and copy from the site owner — once that
  content lands (via the Keystatic admin UI, replacing these five
  entries), this specific typo fix becomes moot. It's still worth landing
  now since the placeholder content is what's live on the site in the
  meantime, and there's no cost to fixing it.
- Do not treat this plan as a substitute for the actual portfolio-content
  replacement — that requires real photography and real client copy that
  no code change can produce, and is explicitly out of scope for the
  `improve` skill (content acquisition, not a code/content-bug fix).
