# Plan 021: Fix the live 404 behind the homepage promo's CTA button

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 25b2392..HEAD -- content/promos/coldside-is-now-a-part-of-antibroadcasting.json`
> If this file changed since this plan was written, compare the "Current
> state" excerpt against the live file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `25b2392`, 2026-08-09

## Why this matters

The only currently-active promo entry (`content/promos/coldside-is-now-a-part-of-antibroadcasting.json`)
renders a CTA button on the homepage (`PromoBanner`, shown via
`app/(site)/page.tsx:352`) whose `ctaHref` is `/coldside-joins-antibroadcasting`
— a route that does not exist anywhere under `app/`. Any visitor who clicks
"Get the details" on the homepage right now lands on the site's 404 page.
This is a live, user-facing defect with zero ambiguity: `find app -iname
"*coldside*"` returns nothing, and no other file in the repo (searched with
`grep -rli "cold side\|coldside"`) references a Cold Side page, so there is
no existing destination this link was meant to point at — it appears the
announcement page was never built, or the promo was published before it was
ready.

The safest fix that requires no guessing about business intent is to clear
the CTA fields on the promo entry. `PromoBanner` already handles this
gracefully — the CTA button only renders `{promo.ctaLabel && promo.ctaHref &&
(...)}` (see `components/ui/PromoBanner.tsx:48-55`), so an empty `ctaLabel`/
`ctaHref` simply removes the button; the rest of the promo banner (title,
description, badge image) is unaffected. This stops the 404 today. Whether to
later add a real announcement page and CTA is a content decision for the site
owner, not something this plan should invent.

## Current state

`content/promos/coldside-is-now-a-part-of-antibroadcasting.json` — full
current contents:

```json
{
  "title": "Cold Side is now part of Antibroadcasting.",
  "description": "For nearly 50 years, the Twin Cities trusted Cold Side Silkscreening for top-tier T-shirt printing and custom embroidery. That legacy is now part of Antibroadcasting — bringing decades of craftsmanship under one roof.",
  "active": true,
  "badgeImage": "/promos/coldside-is-now-a-part-of-antibroadcasting/badgeImage.png",
  "ctaLabel": "Get the details",
  "ctaHref": "/coldside-joins-antibroadcasting"
}
```

`lib/get-active-promo.ts:37-40` — how the two fields are consumed (already
null-safe, no code change needed here):

```ts
ctaLabel: promo.entry.ctaLabel || null,
ctaHref: promo.entry.ctaHref || null,
```

`components/ui/PromoBanner.tsx:48-55` — how the CTA renders (already
null-safe, no code change needed here):

```tsx
{promo.ctaLabel && promo.ctaHref && (
  <TransitionLink
    href={promo.ctaHref}
    className={buttonVariants({ variant: "primary", size: "md" })}
  >
    {promo.ctaLabel}
  </TransitionLink>
)}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Build     | `pnpm build`               | exit 0              |
| Tests     | `pnpm test`                | all pass            |

## Scope

**In scope**:
- `content/promos/coldside-is-now-a-part-of-antibroadcasting.json`

**Out of scope** (do NOT touch, even though they look related):
- `lib/get-active-promo.ts` / `components/ui/PromoBanner.tsx` — already
  handle absent CTA fields correctly; no code change needed.
- `keystatic.config.ts` — schema is unchanged by this plan (see plan
  `022-validate-url-fields-in-keystatic-schema.md` for making `ctaHref` a
  validated field so this class of bug can't recur).
- Do not create a new `/coldside-joins-antibroadcasting` page — there is no
  source content for what that page should say, and inventing marketing copy
  is outside this plan's scope.

## Git workflow

- Branch: `advisor/021-fix-broken-promo-cta-link`
- Commit message style follows this repo's conventional-commit style seen in
  `git log` (e.g. `fix: use accessible accent token for nav active states in
  light mode`) — use `fix:`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Clear the broken CTA fields

Edit `content/promos/coldside-is-now-a-part-of-antibroadcasting.json`,
setting `ctaLabel` and `ctaHref` to empty strings (matching how Keystatic's
admin UI represents an intentionally-cleared optional text field — do not
delete the keys, just empty their values):

```json
{
  "title": "Cold Side is now part of Antibroadcasting.",
  "description": "For nearly 50 years, the Twin Cities trusted Cold Side Silkscreening for top-tier T-shirt printing and custom embroidery. That legacy is now part of Antibroadcasting — bringing decades of craftsmanship under one roof.",
  "active": true,
  "badgeImage": "/promos/coldside-is-now-a-part-of-antibroadcasting/badgeImage.png",
  "ctaLabel": "",
  "ctaHref": ""
}
```

**Verify**: `cat content/promos/coldside-is-now-a-part-of-antibroadcasting.json`
→ `ctaLabel` and `ctaHref` are both `""`, all other fields unchanged.

### Step 2: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
```

**Verify**: all three exit 0.

### Step 3: Manual confirmation (optional but recommended)

```bash
pnpm dev
```

Open `http://localhost:3000` and confirm the promo banner still renders
(title, description, badge image) but with no CTA button. Stop the dev
server when done.

## Test plan

No new automated tests — this is a content-only change with existing
null-safe rendering logic. `pnpm build` succeeding is sufficient automated
verification since the homepage statically renders the promo banner at build
time, which will fail loudly if anything is malformed.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -n "coldside-joins-antibroadcasting" content/promos/*.json` returns no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The file's current contents don't match "Current state" above (someone
  already fixed or changed this promo).
- You find any other content file or code path referencing
  `/coldside-joins-antibroadcasting` that this plan's recon missed — report
  it instead of guessing whether to also fix that reference.

## Maintenance notes

- If the site owner later wants a real "Cold Side joins Antibroadcasting"
  announcement page, that's a separate, content-driven piece of work — build
  the page first, then set `ctaLabel`/`ctaHref` on this promo entry (or a new
  one) to point at it.
- Plan `022-validate-url-fields-in-keystatic-schema.md` adds `fields.url`
  validation to `ctaHref` in the Keystatic schema so a non-existent internal
  path is harder to publish by accident in the future (URL format validation
  only — it cannot detect whether an internal route actually exists).
