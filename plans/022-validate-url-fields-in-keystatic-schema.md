# Plan 022: Use `fields.url`/pattern validation for link fields in `keystatic.config.ts`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 25b2392..HEAD -- keystatic.config.ts`
> If this file changed since this plan was written, compare the "Current
> state" excerpt against the live file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (independent of plan 021, though 021 fixes the live
  instance of the bug this plan prevents recurring)
- **Category**: tech-debt
- **Planned at**: commit `25b2392`, 2026-08-09

## Why this matters

`keystatic.config.ts` currently defines every link-shaped field —
`promos.ctaHref`, `siteInfo.instagramUrl`, `siteInfo.facebookUrl`,
`siteInfo.twitterUrl`, `siteInfo.phoneHref` — as a plain `fields.text()` with
only a description hint (e.g. `'e.g. "/contact"'`). Nothing stops an editor
from saving a typo'd, empty, or otherwise malformed value — which is exactly
how the live 404 fixed in plan `021-fix-broken-promo-cta-link.md` happened:
`ctaHref` was set to `/coldside-joins-antibroadcasting`, a path that doesn't
exist, and the schema had no way to catch it. Keystatic ships a dedicated
`fields.url` type (confirmed present in the installed
`@keystatic/core@0.6.4` type declarations) that validates the value is a
well-formed URL at save time in the admin UI. Using it for the external/
absolute-URL fields turns a silent content bug into an immediate, in-admin
validation error.

Internal paths like `ctaHref` (`/contact`, or the CTA-hiding empty string
from plan 021) are a different case — `fields.url` requires an absolute URL
(scheme + host), so it would reject legitimate relative paths like `/contact`.
For those, this plan adds a lightweight custom `validation` regex on
`fields.text` instead, so at minimum empty-or-`/`-prefixed values are
enforced. Neither approach can verify an internal route actually exists —
that's out of reach for a CMS schema — but both close off the class of
obviously-malformed values (missing leading slash, stray whitespace, a bare
word with no `/` or `https://`).

## Current state

`keystatic.config.ts:106-113` — the promo CTA fields:

```ts
        ctaLabel: fields.text({
          label: "CTA label (optional)",
          description: 'e.g. "Get a Quote" — leave blank to hide the button.',
        }),
        ctaHref: fields.text({
          label: "CTA link (optional)",
          description: 'e.g. "/contact"',
        }),
```

`keystatic.config.ts:131-133` (phone) and `:140-145` (social URLs) inside the
`siteInfo` singleton:

```ts
        phoneHref: fields.text({ label: "Phone href (e.g. tel:6125551234)" }),
        ...
        instagramUrl: fields.text({ label: "Instagram URL" }),
        instagramHandle: fields.text({ label: "Instagram handle" }),
        facebookUrl: fields.text({ label: "Facebook URL" }),
        facebookHandle: fields.text({ label: "Facebook handle" }),
        twitterUrl: fields.text({ label: "X / Twitter URL" }),
        twitterHandle: fields.text({ label: "X / Twitter handle" }),
```

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/declarations/src/form/fields/url/index.d.ts`
confirms the field exists:

```ts
export declare function url(opts?: {
  label?: string;
  description?: string;
  validation?: { isRequired?: boolean };
}): FormField<string | null, string | null>;
```

`fields.url` returns `string | null` from the reader (not `string`, unlike
`fields.text`, which returns `""` when empty) — this matters for `lib/get-site-info.ts`,
which currently does `raw.instagramUrl ?? ""` etc.; that pattern already
handles `null` correctly, so no change is needed there. `lib/get-active-promo.ts`
does the same (`promo.entry.ctaHref || null`), which also already tolerates
either `""` or `null`.

`phoneHref` (`tel:6125551234`) and `facebookHandle`/`instagramHandle`/
`twitterHandle` (bare handles like `@antibroadcasting`, not URLs) are **not**
in scope for `fields.url` — `tel:` URIs and bare handles are not what that
field validates. Leave those as `fields.text`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Build     | `pnpm build`               | exit 0              |
| Tests     | `pnpm test`                | all pass            |

## Scope

**In scope**:
- `keystatic.config.ts`

**Out of scope** (do NOT touch, even though they look related):
- `lib/get-site-info.ts` / `lib/get-active-promo.ts` — their existing
  `?? ""` / `|| null` fallback patterns already handle both `""` and `null`,
  no change needed.
- `phoneHref`, `instagramHandle`, `facebookHandle`, `twitterHandle` — not
  URL-shaped values, leave as `fields.text`.
- `content/site-info.json` / `content/promos/*.json` — existing values
  (`https://www.instagram.com/...`, etc.) are already valid absolute URLs and
  need no edits. Plan 021 already handles clearing the one bad `ctaHref`.

## Git workflow

- Branch: `advisor/022-validate-url-fields-in-keystatic-schema`
- Commit message style follows this repo's conventional-commit style seen in
  `git log` — use `refactor:` (schema types tightened, no behavior change for
  valid existing data).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Switch the three absolute-URL social fields to `fields.url`

In `keystatic.config.ts`, inside the `siteInfo` singleton schema, change:

```ts
        instagramUrl: fields.text({ label: "Instagram URL" }),
```
to
```ts
        instagramUrl: fields.url({ label: "Instagram URL" }),
```

Do the same for `facebookUrl` and `twitterUrl`. Leave `instagramHandle`,
`facebookHandle`, `twitterHandle`, and `phoneHref` untouched.

**Verify**: `grep -n "instagramUrl\|facebookUrl\|twitterUrl" keystatic.config.ts`
→ all three now read `fields.url(...)`.

### Step 2: Add a leading-slash validation pattern to `ctaHref`

`fields.url` cannot be used for `ctaHref` (it must accept relative internal
paths like `/contact`, which `fields.url` rejects as invalid). Instead, add a
`validation.pattern` to keep the existing `fields.text`, requiring the value
either be empty or start with `/`:

```ts
        ctaHref: fields.text({
          label: "CTA link (optional)",
          description: 'e.g. "/contact" — must start with "/", or leave blank to hide the button.',
          validation: {
            pattern: {
              regex: /^$|^\//,
              message: 'Must start with "/" (e.g. "/contact"), or be left blank.',
            },
          },
        }),
```

Before writing this, confirm `fields.text`'s options type actually supports
`validation.pattern` by checking:

```bash
grep -n "pattern" "node_modules/.pnpm/@keystatic+core@0.6.4"*"/node_modules/@keystatic/core/dist/declarations/src/form/fields/text/index.d.ts"
```

If that grep returns no `pattern` match, the text field's validation API
differs from what's assumed here — STOP and report the actual shape found in
that file instead of guessing at a different option name.

**Verify**: `pnpm exec tsc --noEmit` → exit 0 (confirms the validation option
you used matches the installed type signature).

### Step 3: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
```

**Verify**: all three exit 0. `pnpm build` statically renders the homepage,
which reads `siteInfo.social.*` and the active promo's `ctaHref` — a
successful build confirms the existing content in `content/site-info.json`
and `content/promos/*.json` still validates cleanly against the tightened
schema.

### Step 4: Manual confirmation in the admin UI (optional but recommended)

```bash
pnpm dev
```

Open `http://localhost:3000/keystatic/singleton/siteInfo`, try entering a
non-URL string (e.g. `not-a-url`) into the Instagram URL field, and confirm
the admin UI shows a validation error before it lets you save. Open
`http://localhost:3000/keystatic/collection/promos/item/coldside-is-now-a-part-of-antibroadcasting`
and try entering `coldside` (no leading slash) into "CTA link" — confirm it's
rejected. Stop the dev server when done.

## Test plan

No new automated tests — this is a schema-level validation change with no
new runtime logic to unit test. `pnpm build` succeeding against the real
content files is the automated verification; Step 4's manual admin-UI check
is the only way to observe the validation UX itself, since Keystatic's
in-browser form validation isn't exercised by the Node-side reader.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -n "instagramUrl: fields.url\|facebookUrl: fields.url\|twitterUrl: fields.url" keystatic.config.ts` returns 3 matches
- [ ] `grep -n "validation" keystatic.config.ts` includes the new `ctaHref` pattern block
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `fields.url` or the `validation.pattern` option don't match the type
  signatures quoted in "Current state"/Step 2 (the installed Keystatic
  version's API differs from what recon found) — report the actual signature
  from the `.d.ts` file instead of forcing a mismatched option through.
- `pnpm build` fails after Step 1 or Step 2 with a validation error against
  existing content in `content/site-info.json` or `content/promos/*.json` —
  that means real, currently-published data doesn't satisfy the new
  validation; report which field and value failed rather than editing
  content data to work around it.

## Maintenance notes

- If a future field is added that holds an absolute external URL (e.g. a
  press-mentions link, a partner site), default to `fields.url` rather than
  `fields.text` — this plan establishes that as the pattern for this schema.
- `fields.url`'s validation is client-side (admin UI) and reader-side format
  checking only; it cannot verify an internal path like `/contact` actually
  resolves to a real route. If broken internal links become a recurring
  problem, a further enhancement would be a build-time script that cross-
  checks every `ctaHref` value against the Next.js route manifest — out of
  scope here.
