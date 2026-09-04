# Plan 023: Replace "one item per line" textarea fields with `fields.array`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 25b2392..HEAD -- keystatic.config.ts lib/get-site-info.ts app/'(site)'/how-it-works/page.tsx content/site-info.json content/art-requirements`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW-MED
- **Depends on**: none (land this before plan `024-group-siteinfo-fields.md`
  if both are being done — see that plan's "Depends on")
- **Category**: dx
- **Planned at**: commit `25b2392`, 2026-08-09
- **Amended**: 2026-08-09, after a BLOCKED first execution attempt — see
  "Amendment" note below Step 6.

## Why this matters

Four Keystatic fields encode a list as a single multiline string, with the
admin UI description telling the editor to put "one item per line":
`siteInfo.garmentOptions`, `siteInfo.timelineOptions`, `siteInfo.seoKeywords`,
and `artRequirements.items`. This is fragile in the admin UI — it's a plain
textarea with no add/remove/reorder affordance, no per-item validation, and a
stray blank line or trailing whitespace silently changes the parsed list
(each consumer trims and filters empty lines, but an editor doesn't get that
feedback in the form). Keystatic has a purpose-built `fields.array` type
(confirmed in the installed `@keystatic/core@0.6.4` type declarations) that
renders a real list editor — add, remove, drag-to-reorder — and stores the
result as a native JSON array, which is both a better editing experience and
a more robust data shape (no string-splitting convention to get wrong).

This is also a low-risk change for consumers: `components/ui/QuoteForm.tsx`
already expects `garmentOptions: string[]` and `timelineOptions: string[]`
(see `QuoteForm.tsx:29-30`) — today `lib/get-site-info.ts` produces that
shape by splitting a string; after this plan, the array comes directly from
the CMS and the split logic is deleted, with no change needed in
`QuoteForm.tsx` or its caller.

## Current state

`keystatic.config.ts:71-78` — `artRequirements.items`:

```ts
        items: fields.text({
          label: "Items",
          description: "One item per line — each becomes a bullet point.",
          multiline: true,
        }),
```

`keystatic.config.ts:198-208` — the two quote-form option fields:

```ts
        garmentOptions: fields.text({
          label: "Garment options",
          description: "One option per line.",
          multiline: true,
        }),
        timelineOptions: fields.text({
          label: "Timeline options",
          description: "One option per line.",
          multiline: true,
        }),
```

`keystatic.config.ts:180-184` — SEO keywords:

```ts
        seoKeywords: fields.text({
          label: "SEO keywords",
          description: "One keyword or phrase per line.",
          multiline: true,
        }),
```

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/declarations/src/form/fields/array/index.d.ts`
confirms the field exists:

```ts
export declare function array<ElementField extends ComponentSchema>(
  element: ElementField,
  opts?: { label?: string; description?: string; itemLabel?: (...) => string; ... }
): ArrayField<ElementField>;
```

`lib/get-site-info.ts` (full current contents) — `splitLines` is the helper
that will become unnecessary for these three fields:

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";

function splitLines(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const getSiteInfo = cache(async () => {
  const raw = await reader.singletons.siteInfo.read();
  if (!raw) throw new Error("siteInfo singleton not found in content/site-info.json");

  return {
    // ...
    seo: {
      title: raw.metaTitle ?? "",
      description: raw.metaDescription ?? "",
      keywords: splitLines(raw.seoKeywords),
    },
    // ...
    forms: {
      quote: {
        responseTime: raw.responseTime ?? "1–2 business days",
        emailFrom: raw.emailFrom ?? "Quote Request <quotes@antibroadcasting.com>",
        emailTo: raw.emailTo ?? "info@antibroadcasting.com",
        garmentOptions: splitLines(raw.garmentOptions),
        timelineOptions: splitLines(raw.timelineOptions),
      },
    },
  };
});
```

`app/(site)/how-it-works/page.tsx:62-71` — the art-requirements mapping that
splits `items`:

```ts
  const artSections = artEntries
    .map((entry) => ({
      heading: entry.entry.heading,
      items: (entry.entry.items ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order);
```

Current content shape (`content/site-info.json`, relevant lines):

```json
  "seoKeywords": "screen printing\nminneapolis screen printing\ncustom t-shirts\nband merch\nartist prints\nevent merchandise\ncustom apparel\nminnesota screen printing\nantibroadcasting",
  "garmentOptions": "T-Shirt\nLong Sleeve\nHoodie / Sweatshirt\nTank Top\nTote Bag\nOther / Not Sure",
  "timelineOptions": "Standard (7–10 business days)\n2–3 weeks\n1 month+\nRush — I need it ASAP"
```

Current content shape (`content/art-requirements/illustrator-vector-artwork.json`,
representative of all 5 files in that collection):

```json
{
  "heading": "Illustrator / Vector Artwork",
  "items": "Save as .AI or .EPS (CS5 legacy format preferred)\nUse CMYK color mode\nCreate Outlines on all fonts\nConvert all strokes to outlines\nOrganize each color on separate layers (strongly preferred)\nInclude all imported/placed images and graphics\nAvoid clipping masks; use the Pathfinder tool instead",
  "order": 2
}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Build     | `pnpm build`               | exit 0              |
| Tests     | `pnpm test`                | all pass            |

## Scope

**In scope**:
- `keystatic.config.ts`
- `lib/get-site-info.ts`
- `app/(site)/how-it-works/page.tsx`
- `content/site-info.json`
- `content/art-requirements/*.json` (all 5 files)

**Out of scope** (do NOT touch, even though they look related):
- `components/ui/QuoteForm.tsx` — already consumes `string[]`, needs no
  change.
- `app/(site)/contact/page.tsx` — passes `forms.quote.garmentOptions`/
  `timelineOptions` through unchanged; needs no change.
- `keystatic.config.ts`'s `promos`, `faq`, and `gallery` collections — not
  touched by this plan.
- Any grouping of `siteInfo` fields into `fields.object()` sections — that is
  plan `024-group-siteinfo-fields.md`. Do this plan first if both are queued,
  so 024 restructures the schema only once, after field *types* have already
  settled.

## Git workflow

- Branch: `advisor/023-array-fields-for-list-content`
- Commit message style follows this repo's conventional-commit style seen in
  `git log` — use `refactor:`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Convert `artRequirements.items` to `fields.array`

In `keystatic.config.ts`, replace:

```ts
        items: fields.text({
          label: "Items",
          description: "One item per line — each becomes a bullet point.",
          multiline: true,
        }),
```

with:

```ts
        items: fields.array(
          fields.text({ label: "Item" }),
          {
            label: "Items",
            description: "Each item becomes a bullet point.",
            itemLabel: (props) => props.value || "Item",
          },
        ),
```

**Verify**: `pnpm exec tsc --noEmit` → fails at this point (expected — content
files haven't been migrated yet). Continue to Step 2 before re-checking.

### Step 2: Migrate `content/art-requirements/*.json` to array shape

For each of the 5 files in `content/art-requirements/`, convert the `items`
string into a JSON array by splitting on `\n`. Example —
`illustrator-vector-artwork.json` becomes:

```json
{
  "heading": "Illustrator / Vector Artwork",
  "items": [
    "Save as .AI or .EPS (CS5 legacy format preferred)",
    "Use CMYK color mode",
    "Create Outlines on all fonts",
    "Convert all strokes to outlines",
    "Organize each color on separate layers (strongly preferred)",
    "Include all imported/placed images and graphics",
    "Avoid clipping masks; use the Pathfinder tool instead"
  ],
  "order": 2
}
```

Do the same for the other 4 files in that directory (`inks-colors-and-shirts.json`,
`photoshop-raster-artwork.json`, `to-avoid-art-fees.json`,
`typography-and-line-weight.json`) — read each file, split its `items` string
on `\n`, and replace it with the resulting array. Keep `heading` and `order`
unchanged.

**Verify**: `cat content/art-requirements/*.json | grep -c '"items": \['` → `5`

### Step 3: Update `how-it-works/page.tsx` to use the array directly

Replace:

```ts
  const artSections = artEntries
    .map((entry) => ({
      heading: entry.entry.heading,
      items: (entry.entry.items ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order);
```

with:

```ts
  const artSections = artEntries
    .map((entry) => ({
      heading: entry.entry.heading,
      items: entry.entry.items ?? [],
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order);
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0 for this file (may still fail
elsewhere until Steps 4-6 land).

### Step 4: Convert `garmentOptions`, `timelineOptions`, `seoKeywords` to `fields.array`

In `keystatic.config.ts`, replace:

```ts
        garmentOptions: fields.text({
          label: "Garment options",
          description: "One option per line.",
          multiline: true,
        }),
        timelineOptions: fields.text({
          label: "Timeline options",
          description: "One option per line.",
          multiline: true,
        }),
```

with:

```ts
        garmentOptions: fields.array(
          fields.text({ label: "Option" }),
          { label: "Garment options", itemLabel: (props) => props.value || "Option" },
        ),
        timelineOptions: fields.array(
          fields.text({ label: "Option" }),
          { label: "Timeline options", itemLabel: (props) => props.value || "Option" },
        ),
```

And replace:

```ts
        seoKeywords: fields.text({
          label: "SEO keywords",
          description: "One keyword or phrase per line.",
          multiline: true,
        }),
```

with:

```ts
        seoKeywords: fields.array(
          fields.text({ label: "Keyword or phrase" }),
          { label: "SEO keywords", itemLabel: (props) => props.value || "Keyword" },
        ),
```

**Verify**: `grep -n "garmentOptions: fields.array\|timelineOptions: fields.array\|seoKeywords: fields.array" keystatic.config.ts` → 3 matches.

### Step 5: Migrate `content/site-info.json` to array shape

Replace the three string fields with arrays:

```json
  "seoKeywords": [
    "screen printing",
    "minneapolis screen printing",
    "custom t-shirts",
    "band merch",
    "artist prints",
    "event merchandise",
    "custom apparel",
    "minnesota screen printing",
    "antibroadcasting"
  ],
  "garmentOptions": [
    "T-Shirt",
    "Long Sleeve",
    "Hoodie / Sweatshirt",
    "Tank Top",
    "Tote Bag",
    "Other / Not Sure"
  ],
  "timelineOptions": [
    "Standard (7–10 business days)",
    "2–3 weeks",
    "1 month+",
    "Rush — I need it ASAP"
  ]
```

Keep every other field in the file unchanged, in place.

**Verify**: `grep -n '"seoKeywords": \[' content/site-info.json` → 1 match.

### Step 6: Update `lib/get-site-info.ts` to drop the now-unneeded splitting

Replace:

```ts
function splitLines(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
```

Delete this function entirely — it's no longer called by anything once Steps
4-5 land (confirm with the grep in the STOP conditions below before deleting).

Replace:
```ts
      keywords: splitLines(raw.seoKeywords),
```
with:
```ts
      keywords: [...(raw.seoKeywords ?? [])],
```

Replace:
```ts
        garmentOptions: splitLines(raw.garmentOptions),
        timelineOptions: splitLines(raw.timelineOptions),
```
with:
```ts
        garmentOptions: [...(raw.garmentOptions ?? [])],
        timelineOptions: [...(raw.timelineOptions ?? [])],
```

**Verify**: `grep -n "splitLines" lib/get-site-info.ts` → no matches.

**Amendment (2026-08-09, after a BLOCKED first execution attempt)**: the
first executor followed this step exactly as originally written — with
`raw.seoKeywords ?? []` etc., no spread — and hit a STOP condition.
Keystatic's `reader.singletons.siteInfo.read()` types `fields.array` values
as `readonly string[]`, not `string[]`. `?? []` alone doesn't change that:
TypeScript infers the union `readonly string[] | never[]` and widens it to
`readonly string[]`, which then fails to satisfy two **out-of-scope**
consumers that declare mutable `string[]`:
`components/ui/QuoteForm.tsx:29-30` (via `app/(site)/contact/page.tsx:77-78`
passing `forms.quote.garmentOptions`/`timelineOptions` into it) and
`app/layout.tsx:38` (`Metadata.keywords: string | string[] | ...`).

The spread (`[...(raw.X ?? [])]`) copies into a genuinely mutable array at
the point of construction, which is the standard TS idiom for widening a
`readonly T[]` to `T[]` and should resolve the type error without touching
either out-of-scope file. This has not yet been re-run through `tsc` by the
advisor (source edits are the executor's job, not the advisor's, even in a
scratch worktree) — treat it as the next executor's Step 7 to confirm, not
as pre-verified. If the spread does *not* fully resolve the error, STOP
again and report the exact remaining `tsc` output rather than trying a
different workaround. Use the spread form above, not the bare `?? []` form
— this correction supersedes the original code block for this step.

### Step 7: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
```

**Verify**: all three exit 0. `pnpm build` statically renders both the
homepage (`siteInfo`) and `/how-it-works` (`artRequirements`, `siteInfo`) —
a successful build confirms the new array-shaped JSON content matches what
`lib/get-site-info.ts` and `how-it-works/page.tsx` now expect.

### Step 8: Manual confirmation (optional but recommended)

```bash
pnpm dev
```

Open `http://localhost:3000/keystatic/singleton/siteInfo` and confirm
"Garment options", "Timeline options", and "SEO keywords" now render as
add/remove list editors, not a textarea. Open
`http://localhost:3000/keystatic/collection/artRequirements/item/illustrator-vector-artwork`
and confirm "Items" is now a list editor too. Then check
`http://localhost:3000/contact` (quote form garment/timeline dropdowns) and
`http://localhost:3000/how-it-works` (art requirements bullet lists) still
render the same options as before. Stop the dev server when done.

## Test plan

No new automated tests — this is a data-shape migration with existing
consumers already typed for the target shape (`string[]`). `pnpm build`
succeeding against the real, migrated content files is the load-bearing
automated verification, since it exercises `getSiteInfo()` and the
`artRequirements` mapping against real data at build time.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -n "splitLines" lib/get-site-info.ts` returns no matches
- [ ] `grep -rn '"items": "' content/art-requirements/` returns no matches (all 5 files migrated to arrays)
- [ ] `grep -n '"seoKeywords": "\|"garmentOptions": "\|"timelineOptions": "' content/site-info.json` returns no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `fields.array`'s options shape (`itemLabel`, etc.) doesn't match what's
  quoted in "Current state" — re-check the `.d.ts` file at the path given
  there and report the actual signature instead of guessing.
- Before deleting `splitLines` in Step 6, `grep -rn "splitLines" lib/ app/ components/`
  finds a caller outside `lib/get-site-info.ts` — that means the function has
  another use this plan's recon missed; don't delete it, report the caller.
- `pnpm build` fails after the content migration with a schema/type mismatch
  pointing at a field not listed in "Current state" — report it rather than
  editing content further to force a pass.

## Maintenance notes

- Going forward, any new "list of short strings" field in this schema should
  default to `fields.array(fields.text(...))`, not a multiline textarea with
  a newline convention — this plan establishes that as the pattern.
- If plan `024-group-siteinfo-fields.md` is executed after this one, its
  "Current state" excerpts for `garmentOptions`/`timelineOptions`/
  `seoKeywords` must be re-read from the live file first (they'll show the
  `fields.array` form this plan produces, not the original `fields.text`
  form) — that plan's own drift check should catch this, but flag it if not.
