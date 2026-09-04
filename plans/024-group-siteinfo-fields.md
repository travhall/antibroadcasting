# Plan 024: Group the `siteInfo` singleton's fields with `fields.object()`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 25b2392..HEAD -- keystatic.config.ts lib/get-site-info.ts content/site-info.json`
> This plan assumes plans `022-validate-url-fields-in-keystatic-schema.md`
> and `023-array-fields-for-list-content.md` have already landed (their field
> *types* — `fields.url` for social URLs, `fields.array` for
> garment/timeline/keyword lists — are baked into the "Current state" below).
> If those plans haven't run yet, or if any in-scope file otherwise differs
> from the excerpts below, treat it as a STOP condition and re-read the live
> file before proceeding.

## Status

- **Priority**: P2
- **Effort**: S/M
- **Risk**: LOW
- **Depends on**: `022-validate-url-fields-in-keystatic-schema.md`,
  `023-array-fields-for-list-content.md`
- **Category**: dx
- **Planned at**: commit `25b2392`, 2026-08-09

## Why this matters

The `siteInfo` singleton in `keystatic.config.ts` has 25 fields in a single
flat `schema` object. The code already groups them conceptually with comment
dividers (`// ── Company ──`, `// ── Contact ──`, `// ── Social ──`, etc.),
but Keystatic's admin UI has no visibility into comments — an editor opening
`/keystatic/singleton/siteInfo` sees one long unsegmented form, scrolling
past unrelated fields (SEO settings next to booking-badge settings next to
quote-form email addresses) to find what they need. Keystatic's `fields.object()`
turns a set of fields into a visually grouped, collapsible section in the
actual admin form (confirmed present in the installed `@keystatic/core@0.6.4`
type declarations) — this directly targets the UX gap: the grouping the code
comments already describe becomes real grouping in the tool non-technical
editors actually use.

This is a schema/content-shape change, not a behavior change: every field
keeps its type and semantics, they just nest one level deeper. `lib/get-site-info.ts`
already reshapes the flat `raw.*` fields into a nested `{ company, contact,
social, booking, business, seo, forms }` object for its own consumers — this
plan makes the *source* schema mirror that same grouping, so the mapping in
`get-site-info.ts` becomes a much closer 1:1 pass-through instead of a full
reshape.

## Current state

`keystatic.config.ts:118-210` — the `siteInfo` singleton, current full
schema (reflecting plans 022 and 023 already applied — `fields.url` for the
three social URLs, `fields.array` for `garmentOptions`/`timelineOptions`/
`seoKeywords`):

```ts
    siteInfo: singleton({
      label: "Site Info",
      path: "content/site-info",
      format: { data: "json" },
      schema: {
        // ── Company ──────────────────────────────────────────────────
        companyName: fields.text({ label: "Company name" }),
        companyLegalName: fields.text({ label: "Legal name" }),
        companyNickname: fields.text({ label: "Short name / nickname" }),
        companyTagline: fields.text({ label: "Tagline" }),

        // ── Contact ──────────────────────────────────────────────────
        phone: fields.text({ label: "Phone (display)" }),
        phoneHref: fields.text({ label: "Phone href (e.g. tel:6125551234)" }),
        email: fields.text({ label: "Email address" }),
        addressStreet: fields.text({ label: "Street address" }),
        addressCity: fields.text({ label: "City" }),
        addressState: fields.text({ label: "State" }),
        addressZip: fields.text({ label: "ZIP code" }),

        // ── Social ───────────────────────────────────────────────────
        instagramUrl: fields.url({ label: "Instagram URL" }),
        instagramHandle: fields.text({ label: "Instagram handle" }),
        facebookUrl: fields.url({ label: "Facebook URL" }),
        facebookHandle: fields.text({ label: "Facebook handle" }),
        twitterUrl: fields.url({ label: "X / Twitter URL" }),
        twitterHandle: fields.text({ label: "X / Twitter handle" }),

        // ── Booking status ───────────────────────────────────────────
        nowBookingVisible: fields.checkbox({
          label: 'Show "Now Booking" badge on homepage',
          defaultValue: true,
        }),
        nowBookingLabel: fields.text({
          label: '"Now Booking" label text',
          description: 'e.g. "Summer \'26" or "Fall \'26 — Limited Spots"',
          defaultValue: "Summer '26",
        }),

        // ── Business rules ───────────────────────────────────────────
        minimumOrder: fields.number({ label: "Minimum order (pieces)" }),
        turnaroundDays: fields.text({
          label: "Standard turnaround",
          description: 'e.g. "7–10"',
        }),
        maxColors: fields.number({ label: "Maximum ink colors" }),
        responseTime: fields.text({
          label: "Quote response time",
          description: 'e.g. "1–2 business days"',
        }),

        // ── SEO ──────────────────────────────────────────────────────
        metaTitle: fields.text({
          label: "Default page title",
          description: 'Used in <title> and Open Graph. e.g. "Antibroadcasting Inc. — Minneapolis Screen Printing"',
        }),
        metaDescription: fields.text({
          label: "Default meta description",
          description: 'Used in <meta name="description"> and Open Graph.',
          multiline: true,
        }),
        seoKeywords: fields.array(
          fields.text({ label: "Keyword or phrase" }),
          { label: "SEO keywords", itemLabel: (props) => props.value || "Keyword" },
        ),

        // ── Email addresses ───────────────────────────────────────────
        emailFrom: fields.text({
          label: "Quote form — From address",
          description: 'The address emails are sent from. Must be verified in Resend. e.g. "quotes@antibroadcasting.com"',
          defaultValue: "Quote Request <quotes@antibroadcasting.com>",
        }),
        emailTo: fields.text({
          label: "Quote form — To address",
          description: "Where quote requests are delivered. Separate multiple addresses with commas.",
          defaultValue: "info@antibroadcasting.com",
        }),

        // ── Quote form options (one per line) ─────────────────────────
        garmentOptions: fields.array(
          fields.text({ label: "Option" }),
          { label: "Garment options", itemLabel: (props) => props.value || "Option" },
        ),
        timelineOptions: fields.array(
          fields.text({ label: "Option" }),
          { label: "Timeline options", itemLabel: (props) => props.value || "Option" },
        ),
      },
    }),
```

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/declarations/src/form/fields/object/index.d.ts`
confirms the field exists:

```ts
export declare function object<Fields extends Record<string, ComponentSchema>>(
  fields: Fields,
  opts?: ObjectFieldOptions,
): ObjectField<Fields>;
```

The reader resolves a nested `object` field to a plain nested object — e.g.
`fields.object({ companyName: fields.text(...) })` under key `company` reads
back as `raw.company.companyName`, confirmed via the `ValueForReading<Schema>`
conditional type in `.../form/api.d.ts:336`, which maps `ObjectField<Value>`
to `{ [K in keyof Value]: ValueForReading<Value[K]> }`.

`lib/get-site-info.ts` — full current contents (reflecting plan 023 already
applied — no more `splitLines`):

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";

export const getSiteInfo = cache(async () => {
  const raw = await reader.singletons.siteInfo.read();
  if (!raw) throw new Error("siteInfo singleton not found in content/site-info.json");

  return {
    company: {
      name: raw.companyName ?? "",
      legalName: raw.companyLegalName ?? "",
      nickname: raw.companyNickname ?? "",
      tagline: raw.companyTagline ?? "",
    },
    contact: {
      phone: raw.phone ?? "",
      phoneHref: raw.phoneHref ?? "",
      email: raw.email ?? "",
      address: {
        street: raw.addressStreet ?? "",
        city: raw.addressCity ?? "",
        state: raw.addressState ?? "",
        zip: raw.addressZip ?? "",
        full: `${raw.addressStreet ?? ""}, ${raw.addressCity ?? ""}, ${raw.addressState ?? ""} ${raw.addressZip ?? ""}`,
        location: `${raw.addressCity ?? ""}, ${raw.addressState ?? ""}`,
      },
    },
    social: {
      instagram: { url: raw.instagramUrl ?? "", handle: raw.instagramHandle ?? "" },
      facebook: { url: raw.facebookUrl ?? "", handle: raw.facebookHandle ?? "" },
      twitter: { url: raw.twitterUrl ?? "", handle: raw.twitterHandle ?? "" },
    },
    booking: {
      visible: raw.nowBookingVisible ?? true,
      label: raw.nowBookingLabel ?? "Summer '26",
    },
    business: {
      minimumOrder: raw.minimumOrder ?? 50,
      turnaroundDays: raw.turnaroundDays ?? "7–10",
      maxColors: raw.maxColors ?? 8,
    },
    seo: {
      title: raw.metaTitle ?? "",
      description: raw.metaDescription ?? "",
      keywords: raw.seoKeywords ?? [],
    },
    forms: {
      quote: {
        responseTime: raw.responseTime ?? "1–2 business days",
        emailFrom: raw.emailFrom ?? "Quote Request <quotes@antibroadcasting.com>",
        emailTo: raw.emailTo ?? "info@antibroadcasting.com",
        garmentOptions: raw.garmentOptions ?? [],
        timelineOptions: raw.timelineOptions ?? [],
      },
    },
  };
});

export type SiteInfo = Awaited<ReturnType<typeof getSiteInfo>>;
```

Note: `getSiteInfo()`'s **output shape** (the object every page consumes) is
explicitly out of scope for this plan — only the CMS schema and the
raw-to-output mapping inside this function change. No caller of `getSiteInfo()`
(`app/(site)/page.tsx`, `app/(site)/contact/page.tsx`, `app/layout.tsx`, etc.)
needs to change.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Build     | `pnpm build`               | exit 0              |
| Tests     | `pnpm test`                | all pass            |

## Scope

**In scope**:
- `keystatic.config.ts` (the `siteInfo` singleton only)
- `lib/get-site-info.ts`
- `content/site-info.json`

**Out of scope** (do NOT touch, even though they look related):
- The output shape of `getSiteInfo()` (its return type/`SiteInfo` export) —
  must stay identical; every caller depends on the current flat-ish
  `{ company, contact, social, booking, business, seo, forms }` shape.
- `keystatic.config.ts`'s `gallery`, `faq`, `artRequirements`, `promos`
  collections — not touched by this plan.
- Any page/component under `app/` or `components/` — none of them read
  `content/site-info.json` directly; all go through `getSiteInfo()`, whose
  output shape is unchanged.

## Git workflow

- Branch: `advisor/024-group-siteinfo-fields`
- Commit message style follows this repo's conventional-commit style seen in
  `git log` — use `refactor:`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Restructure the `siteInfo` schema into `fields.object()` groups

In `keystatic.config.ts`, replace the entire `siteInfo` singleton's `schema`
block (shown in full in "Current state" above) with:

```ts
      schema: {
        company: fields.object(
          {
            name: fields.text({ label: "Company name" }),
            legalName: fields.text({ label: "Legal name" }),
            nickname: fields.text({ label: "Short name / nickname" }),
            tagline: fields.text({ label: "Tagline" }),
          },
          { label: "Company" },
        ),

        contact: fields.object(
          {
            phone: fields.text({ label: "Phone (display)" }),
            phoneHref: fields.text({ label: "Phone href (e.g. tel:6125551234)" }),
            email: fields.text({ label: "Email address" }),
            addressStreet: fields.text({ label: "Street address" }),
            addressCity: fields.text({ label: "City" }),
            addressState: fields.text({ label: "State" }),
            addressZip: fields.text({ label: "ZIP code" }),
          },
          { label: "Contact" },
        ),

        social: fields.object(
          {
            instagramUrl: fields.url({ label: "Instagram URL" }),
            instagramHandle: fields.text({ label: "Instagram handle" }),
            facebookUrl: fields.url({ label: "Facebook URL" }),
            facebookHandle: fields.text({ label: "Facebook handle" }),
            twitterUrl: fields.url({ label: "X / Twitter URL" }),
            twitterHandle: fields.text({ label: "X / Twitter handle" }),
          },
          { label: "Social" },
        ),

        booking: fields.object(
          {
            visible: fields.checkbox({
              label: 'Show "Now Booking" badge on homepage',
              defaultValue: true,
            }),
            label: fields.text({
              label: '"Now Booking" label text',
              description: 'e.g. "Summer \'26" or "Fall \'26 — Limited Spots"',
              defaultValue: "Summer '26",
            }),
          },
          { label: "Booking status" },
        ),

        business: fields.object(
          {
            minimumOrder: fields.number({ label: "Minimum order (pieces)" }),
            turnaroundDays: fields.text({
              label: "Standard turnaround",
              description: 'e.g. "7–10"',
            }),
            maxColors: fields.number({ label: "Maximum ink colors" }),
            responseTime: fields.text({
              label: "Quote response time",
              description: 'e.g. "1–2 business days"',
            }),
          },
          { label: "Business rules" },
        ),

        seo: fields.object(
          {
            metaTitle: fields.text({
              label: "Default page title",
              description: 'Used in <title> and Open Graph. e.g. "Antibroadcasting Inc. — Minneapolis Screen Printing"',
            }),
            metaDescription: fields.text({
              label: "Default meta description",
              description: 'Used in <meta name="description"> and Open Graph.',
              multiline: true,
            }),
            seoKeywords: fields.array(
              fields.text({ label: "Keyword or phrase" }),
              { label: "SEO keywords", itemLabel: (props) => props.value || "Keyword" },
            ),
          },
          { label: "SEO" },
        ),

        quoteForm: fields.object(
          {
            emailFrom: fields.text({
              label: "From address",
              description: 'The address emails are sent from. Must be verified in Resend. e.g. "quotes@antibroadcasting.com"',
              defaultValue: "Quote Request <quotes@antibroadcasting.com>",
            }),
            emailTo: fields.text({
              label: "To address",
              description: "Where quote requests are delivered. Separate multiple addresses with commas.",
              defaultValue: "info@antibroadcasting.com",
            }),
            garmentOptions: fields.array(
              fields.text({ label: "Option" }),
              { label: "Garment options", itemLabel: (props) => props.value || "Option" },
            ),
            timelineOptions: fields.array(
              fields.text({ label: "Option" }),
              { label: "Timeline options", itemLabel: (props) => props.value || "Option" },
            ),
          },
          { label: "Quote form" },
        ),
      },
```

**Verify**: `pnpm exec tsc --noEmit` → fails at this point (expected — the
content file hasn't been migrated yet). Continue to Step 2 before
re-checking.

### Step 2: Migrate `content/site-info.json` to the nested shape

Rewrite the file to match the new grouping. Using the current data (adjust
if plans 022/023 already changed the array/URL values from their originals —
carry forward whatever the live values are):

```json
{
  "company": {
    "name": "Antibroadcasting Screen Printing",
    "legalName": "Antibroadcasting, Inc.",
    "nickname": "Antibroadcasting",
    "tagline": "Custom Screen Printing. Quality Prints Daily."
  },
  "contact": {
    "phone": "612.836.9488",
    "phoneHref": "tel:6128369488",
    "email": "info@antibroadcasting.com",
    "addressStreet": "3715 Oregon Ave S #5",
    "addressCity": "Minneapolis",
    "addressState": "MN",
    "addressZip": "55426"
  },
  "social": {
    "instagramUrl": "https://www.instagram.com/antibroadcasting_inc/",
    "instagramHandle": "@antibroadcasting_inc",
    "facebookUrl": "https://www.facebook.com/antibroadcasting",
    "facebookHandle": "@antibroadcasting",
    "twitterUrl": "https://x.com/mplsprinting",
    "twitterHandle": "@mplsprinting"
  },
  "booking": {
    "visible": true,
    "label": "Fall '26"
  },
  "business": {
    "minimumOrder": 50,
    "turnaroundDays": "7–10",
    "maxColors": 8,
    "responseTime": "1–2 business days"
  },
  "seo": {
    "metaTitle": "Antibroadcasting Inc. — Minneapolis Screen Printing",
    "metaDescription": "Artist-run screen printing shop in Minneapolis. Quality prints for bands, artists, and events. 50pc minimums, 7–10 day turnaround.",
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
    ]
  },
  "quoteForm": {
    "emailFrom": "Quote Request <quotes@antibroadcasting.com>",
    "emailTo": "info@antibroadcasting.com",
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
  }
}
```

Before writing this, `cat content/site-info.json` and use the **live**
values for every field (this excerpt is built from what recon read on
2026-08-09 — if plans 022/023 or a manual edit changed any value since, carry
the live value forward, don't overwrite it with what's shown here).

**Verify**: `pnpm exec tsc --noEmit` → still fails (expected — `get-site-info.ts`
hasn't been updated yet). Continue to Step 3.

### Step 3: Update `lib/get-site-info.ts` to read from the nested paths

Replace the body of `getSiteInfo` with:

```ts
export const getSiteInfo = cache(async () => {
  const raw = await reader.singletons.siteInfo.read();
  if (!raw) throw new Error("siteInfo singleton not found in content/site-info.json");

  return {
    company: {
      name: raw.company.name ?? "",
      legalName: raw.company.legalName ?? "",
      nickname: raw.company.nickname ?? "",
      tagline: raw.company.tagline ?? "",
    },
    contact: {
      phone: raw.contact.phone ?? "",
      phoneHref: raw.contact.phoneHref ?? "",
      email: raw.contact.email ?? "",
      address: {
        street: raw.contact.addressStreet ?? "",
        city: raw.contact.addressCity ?? "",
        state: raw.contact.addressState ?? "",
        zip: raw.contact.addressZip ?? "",
        full: `${raw.contact.addressStreet ?? ""}, ${raw.contact.addressCity ?? ""}, ${raw.contact.addressState ?? ""} ${raw.contact.addressZip ?? ""}`,
        location: `${raw.contact.addressCity ?? ""}, ${raw.contact.addressState ?? ""}`,
      },
    },
    social: {
      instagram: { url: raw.social.instagramUrl ?? "", handle: raw.social.instagramHandle ?? "" },
      facebook: { url: raw.social.facebookUrl ?? "", handle: raw.social.facebookHandle ?? "" },
      twitter: { url: raw.social.twitterUrl ?? "", handle: raw.social.twitterHandle ?? "" },
    },
    booking: {
      visible: raw.booking.visible ?? true,
      label: raw.booking.label ?? "Summer '26",
    },
    business: {
      minimumOrder: raw.business.minimumOrder ?? 50,
      turnaroundDays: raw.business.turnaroundDays ?? "7–10",
      maxColors: raw.business.maxColors ?? 8,
    },
    seo: {
      title: raw.seo.metaTitle ?? "",
      description: raw.seo.metaDescription ?? "",
      keywords: raw.seo.seoKeywords ?? [],
    },
    forms: {
      quote: {
        responseTime: raw.business.responseTime ?? "1–2 business days",
        emailFrom: raw.quoteForm.emailFrom ?? "Quote Request <quotes@antibroadcasting.com>",
        emailTo: raw.quoteForm.emailTo ?? "info@antibroadcasting.com",
        garmentOptions: raw.quoteForm.garmentOptions ?? [],
        timelineOptions: raw.quoteForm.timelineOptions ?? [],
      },
    },
  };
});
```

Note `responseTime` moves from the top-level `raw.responseTime` to
`raw.business.responseTime` (it lives in the "Business rules" group in the
new schema, matching where the original code comment already placed it) —
the **output** shape (`forms.quote.responseTime`) is unchanged, only the
source path changes.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
```

**Verify**: all three exit 0. `pnpm build` statically renders the homepage
and every other page that calls `getSiteInfo()` — a successful build is a
real end-to-end check that the nested JSON file matches what the new schema
and mapping function expect.

### Step 5: Manual confirmation in the admin UI (optional but recommended)

```bash
pnpm dev
```

Open `http://localhost:3000/keystatic/singleton/siteInfo` and confirm the
form now shows 7 labeled, visually separated sections (Company, Contact,
Social, Booking status, Business rules, SEO, Quote form) instead of one flat
list. Spot-check the homepage (`http://localhost:3000`) and `/contact` still
render the same company/contact/booking/quote-form data as before. Stop the
dev server when done.

## Test plan

No new automated tests — this is a schema/content restructuring with an
unchanged output contract (`SiteInfo` type). `pnpm build` succeeding against
the real, migrated `content/site-info.json` is the load-bearing automated
verification, since every page that calls `getSiteInfo()` renders at build
time.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -n "company: fields.object\|contact: fields.object\|social: fields.object\|booking: fields.object\|business: fields.object\|seo: fields.object\|quoteForm: fields.object" keystatic.config.ts` returns 7 matches
- [ ] `grep -n '"companyName"' content/site-info.json` returns no matches (old flat key removed)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plans 022 and/or 023 have not landed yet and the live `keystatic.config.ts`
  doesn't match the "Current state" excerpt (still has `fields.text` for
  social URLs, or `fields.text({ multiline: true })` for the list fields) —
  re-derive the object-grouping from whatever the live flat schema actually
  is, keeping each field's existing type unchanged, rather than forcing the
  `fields.url`/`fields.array` types shown here.
- `pnpm build` fails after Step 3 with an error suggesting `raw.<group>` is
  `undefined` — that means the JSON nesting in Step 2 doesn't match the
  schema grouping in Step 1; re-check the two are structurally identical.
- Any live value in `content/site-info.json` differs from what's shown in
  Step 2's excerpt (e.g. a real phone number, address, or email was updated
  since this plan was written) — use the live value, not the one printed
  here; if unsure which is current, re-read the file immediately before
  writing the migrated version.

## Maintenance notes

- Any new `siteInfo` field should be added inside the group it conceptually
  belongs to (or a new group, with its own `fields.object()` and label) —
  don't add flat top-level fields again; that's the exact problem this plan
  fixes.
- `lib/get-site-info.ts`'s `getSiteInfo()` output shape is the stable public
  contract for the rest of the app — if a future schema change (this plan or
  any other) needs to change that output shape, every caller (`app/(site)/page.tsx`,
  `app/(site)/contact/page.tsx`, `app/layout.tsx`, and others found via
  `grep -rn "getSiteInfo" app`) must be checked, not just this file.
