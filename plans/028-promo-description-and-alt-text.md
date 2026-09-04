# Plan 028: Rich-text promo descriptions + real alt-text fields

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d479ad9..HEAD -- keystatic.config.ts lib/get-active-promo.ts lib/get-gallery.ts components/ui/PromoBanner.tsx components/ui/GalleryGrid.tsx components/ui/FeaturedWorkGrid.tsx components/ui/Lightbox.tsx content/promos content/gallery`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW-MED (touches 3 components and 2 lib files, but each change
  is additive/mechanical)
- **Depends on**: `027-guardrailed-pages-collection.md` (not a hard code
  dependency — the `fields.document` + `DocumentRenderer` usage this plan
  adds to `promos.description` is a second, independent instance of the
  same pattern 027 establishes first in this codebase; land 027 first so
  there's a working precedent to compare against if something doesn't
  behave as expected here)
- **Category**: direction (UX)
- **Planned at**: commit `d479ad9`, 2026-08-10

## Why this matters

Two small, independent gaps surfaced during a UX review of the Keystatic
implementation:

**1. `promos.description` can't contain a link.** It's `fields.text({
multiline: true })` — a plain string, no formatting, no links. The current
live promo's copy ("Cold Side is now part of Antibroadcasting... That legacy
is now part of Antibroadcasting") is exactly the kind of copy that would
naturally want an inline link (e.g. to a future announcement page — see
plan 027). Every other body-copy field in this schema has the same
limitation, but `promos.description` is the one with a concrete, current
need.

**2. The promo badge image has no alt text.** `components/ui/PromoBanner.tsx:18`
hardcodes `alt=""` — the badge image (e.g. the Cold Side logo badge) is
being marked decorative when it isn't; it's meaningful content with no
text-equivalent anywhere else on the banner. This is a real gap, unlike
gallery images: `components/ui/GalleryGrid.tsx`, `FeaturedWorkGrid.tsx`, and
`Lightbox.tsx` already generate a reasonable (if generic) `` `${client}
screen print` `` alt string for every gallery item — not broken, just
improvable. This plan adds an **optional** `imageAlt` override field to
`gallery` so an editor can write something more specific when they want to
(e.g. "Four-color print on navy crewneck, tour dates on back") — falling
back to the existing generated string when left blank, so nothing regresses
for the 6 gallery entries that won't get a custom value on day one.

Neither the gallery alt-text override nor the promo badge alt-text field is
seeded with invented descriptions in this plan — nobody on this side has
seen the actual photos, and a wrong guess at alt text is worse than an
honest generic fallback. Both ship empty/absent, ready for the site owner to
fill in through the admin UI when they choose to.

## Current state

`keystatic.config.ts` — the `promos` collection's relevant fields (current):

```ts
        description: fields.text({ label: "Description", multiline: true }),
        // ...
        badgeImage: fields.image({
          label: "Eyebrow badge image (optional)",
          description:
            "Replaces the icon + label above the title. Leave blank to use the label instead.",
          directory: "public/promos",
          publicPath: "/promos",
        }),
```

`keystatic.config.ts` — the `gallery` collection's relevant field (current):

```ts
        image: fields.image({
          label: "Image",
          directory: "public/gallery",
          publicPath: "/gallery",
        }),
```

`fields.image()` has **no built-in alt-text sub-schema** — confirmed via
`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/declarations/src/form/fields/image/index.d.ts`,
whose options are `label`, `directory`, `validation`, `description`,
`publicPath`, `transformFilename` only. Alt text must be a separate sibling
field, not an option on `fields.image` itself.

`lib/get-active-promo.ts` — full current contents:

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";

export interface ActivePromo {
  slug: string;
  title: string;
  description: string;
  expiresAt: string | null;
  label: string | null;
  badgeImage: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

export const getActivePromo = cache(async (): Promise<ActivePromo | null> => {
  const entries = await reader.collections.promos.all();
  const today = new Date().toISOString().slice(0, 10);

  const live = entries
    .filter((e) => e.entry.active)
    .filter((e) => !e.entry.expiresAt || e.entry.expiresAt >= today)
    .sort((a, b) => {
      if (!a.entry.expiresAt) return 1;
      if (!b.entry.expiresAt) return -1;
      return a.entry.expiresAt.localeCompare(b.entry.expiresAt);
    });

  const promo = live[0];
  if (!promo) return null;

  return {
    slug: promo.slug,
    title: promo.entry.title,
    description: promo.entry.description ?? "",
    expiresAt: promo.entry.expiresAt,
    label: promo.entry.label || null,
    badgeImage: promo.entry.badgeImage || null,
    ctaLabel: promo.entry.ctaLabel || null,
    ctaHref: promo.entry.ctaHref || null,
  };
});
```

`components/ui/PromoBanner.tsx` — full current contents:

```tsx
import Image from "next/image";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { buttonVariants } from "@/components/ui/Button";
import { RegistrationMark } from "@/components/ui/RegistrationMark";
import type { ActivePromo } from "@/lib/get-active-promo";

export function PromoBanner({ promo }: { promo: ActivePromo }) {
  return (
    <section
      aria-labelledby="promo-heading"
      className="my-16 border border-foreground/15 px-6 py-8 md:px-10 md:py-10 flex flex-col lg:flex-row lg:items-center gap-6 md:gap-10"
    >
      <div className="flex items-center gap-3 shrink-0">
        {promo.badgeImage ? (
          <div className="relative min-h-40 w-full sm:min-h-52 sm:min-w-52 md:min-h-60 md:min-w-60 shrink-0">
            <Image
              src={promo.badgeImage}
              alt=""
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        ) : (
          <>
            <RegistrationMark className="w-5 h-5 text-gold" />
            <span className="font-mono text-xs uppercase tracking-widest text-text-accent">
              {promo.label || "The Latest News"}
            </span>
          </>
        )}
      </div>

      <div className="flex-1">
        <h2
          id="promo-heading"
          className="font-display font-black uppercase text-4xl md:text-5xl lg:text-6xl leading-none"
        >
          {promo.title}
        </h2>
        {promo.description && (
          <p className="mt-4 text-text-secondary max-w-prose leading-relaxed">
            {promo.description}
          </p>
        )}
      </div>

      {promo.ctaLabel && promo.ctaHref && (
        <TransitionLink
          href={promo.ctaHref}
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          {promo.ctaLabel}
        </TransitionLink>
      )}
    </section>
  );
}
```

`content/promos/coldside-is-now-a-part-of-antibroadcasting.json` — full
current contents (the only promo entry that exists):

```json
{
  "title": "Cold Side is now part of Antibroadcasting.",
  "description": "For nearly 50 years, the Twin Cities trusted Cold Side Silkscreening for top-tier T-shirt printing and custom embroidery. That legacy is now part of Antibroadcasting — bringing decades of craftsmanship under one roof.",
  "active": true,
  "badgeImage": "/promos/coldside-is-now-a-part-of-antibroadcasting/badgeImage.png",
  "ctaLabel": "Get to know us",
  "ctaHref": "/about"
}
```

`lib/get-gallery.ts` — full current contents:

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";
import type { GalleryItem } from "@/components/ui/GalleryGrid";

export const getGallery = cache(async (): Promise<GalleryItem[]> => {
  const entries = await reader.collections.gallery.all();
  return entries.map((entry) => ({
    slug: entry.slug,
    title: entry.entry.title,
    client: entry.entry.client,
    category: entry.entry.category ?? "",
    image: entry.entry.image,
    description: entry.entry.description ?? null,
    featured: entry.entry.featured,
    colors: entry.entry.colors,
    year: entry.entry.year,
  }));
});
```

`components/ui/GalleryGrid.tsx` — the `GalleryItem` type (exported, reused
by `FeaturedWorkGrid.tsx` and `Lightbox.tsx`) and its current `alt=`
(line ~106):

```ts
export type GalleryItem = {
  slug: string;
  title: string;
  client: string | null;
  category: string;
  image: string | null;
  description: string | null;
  featured: boolean | null;
  colors: number | null;
  year: number | null;
};
```
```tsx
              alt={`${item.client ?? item.title} screen print`}
```

`components/ui/FeaturedWorkGrid.tsx:38` and `components/ui/Lightbox.tsx:126`
have the identical `` alt={`${item.client ?? item.title} screen print`} ``
expression — three separate call sites, all deriving from the same
`GalleryItem`.

`fields.document`'s exact API (signature, `DocumentFeaturesConfig` shape,
`DocumentRenderer` props, the lazy-function content-read behavior) is
documented in full in plan `027-guardrailed-pages-collection.md`'s "Current
state" section — re-read it there rather than duplicating it here; this
plan applies the same field type to a second, more restricted use.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Build     | `pnpm build`               | exit 0              |
| Tests     | `pnpm test`                | all pass            |
| Lint      | `pnpm lint`                | exit 0              |

## Scope

**In scope**:
- `keystatic.config.ts` (`promos` and `gallery` collections only)
- `lib/get-active-promo.ts`
- `lib/get-gallery.ts`
- `components/ui/PromoBanner.tsx`
- `components/ui/GalleryGrid.tsx`
- `components/ui/FeaturedWorkGrid.tsx`
- `components/ui/Lightbox.tsx`
- `content/promos/coldside-is-now-a-part-of-antibroadcasting.json` (via the
  Keystatic admin UI — see Step 3; do not hand-edit its `description` field
  in a text editor)
- `content/gallery/*.json` (adding an absent/empty `imageAlt` key only — see
  Step 6)

**Out of scope** (do NOT touch, even though they look related):
- `faq`, `artRequirements` collections — plain-text fields stay as-is; this
  plan only touches the two fields with a concrete, evidenced need.
- Inventing descriptive alt text for any existing image — every new
  alt-text field ships empty/absent. Do not write plausible-sounding
  descriptions of images you haven't seen.
- The `pages` collection or `/updates/[slug]` route — that's plan 027,
  entirely separate files.

## Git workflow

- Branch: `advisor/028-promo-description-and-alt-text`
- Commit message style follows this repo's conventional-commit style seen in
  `git log` — use `feat:` for the new alt-text fields, `refactor:` for the
  `description` field-type change.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Convert `promos.description` to a restricted `fields.document`

In `keystatic.config.ts`, replace:

```ts
        description: fields.text({ label: "Description", multiline: true }),
```

with:

```ts
        description: fields.document({
          label: "Description",
          formatting: { inlineMarks: { bold: true, italic: true } },
          links: true,
        }),
```

No lists, no headings, no images — deliberately narrower than plan 027's
`pages.content` field, since a promo description is a short banner blurb,
not page-length content.

**Verify**: `pnpm exec tsc --noEmit` → fails at this point (content and
consumers haven't been updated yet — expected, continue).

### Step 2: Add `badgeImageAlt` to the `promos` collection

Immediately after the `badgeImage` field, add:

```ts
        badgeImageAlt: fields.text({
          label: "Badge image alt text (optional)",
          description:
            "Describes the badge image for screen readers. Leave blank if the image is purely decorative.",
        }),
```

**Verify**: `grep -n "badgeImageAlt" keystatic.config.ts` → 1 match.

### Step 3: Migrate the one existing promo entry through the admin UI

`fields.document`'s stored JSON shape is a Keystatic implementation detail,
not meant for hand-authoring — do not hand-write a document node structure.
Instead:

```bash
pnpm dev
```

1. Open `http://localhost:3000/keystatic/collection/promos/item/coldside-is-now-a-part-of-antibroadcasting`.
2. The "Description" field is now a rich-text editor, currently empty (the
   old plain-string value doesn't carry over automatically — Keystatic will
   show it empty or may show a read error depending on version; either way,
   don't fight it, just re-enter the text).
3. Type in the same copy that was there before: "For nearly 50 years, the
   Twin Cities trusted Cold Side Silkscreening for top-tier T-shirt printing
   and custom embroidery. That legacy is now part of Antibroadcasting —
   bringing decades of craftsmanship under one roof." (copy this exactly
   from "Current state" above — don't paraphrase).
4. Leave "Badge image alt text" blank for now (per "Why this matters" — no
   invented descriptions).
5. Save.
6. Stop the dev server.

**Verify**: `content/promos/coldside-is-now-a-part-of-antibroadcasting.json`
now has a `description` value that's a JSON array/object (not a plain
string), and a `badgeImageAlt` key that's an empty string or absent
(whichever Keystatic produces for an untouched optional text field — check
`git diff` to see which).

### Step 4: Update `lib/get-active-promo.ts` for the new field shapes

`description` changes from `string` to whatever `fields.document` reads
back as (per plan 027's "Current state": a lazy `() => Promise<DocumentElement[]>`
for a `ContentFormField`). Update the interface and mapping:

```ts
import { cache } from "react";
import type { DocumentElement } from "@keystatic/core";
import { reader } from "@/lib/keystatic";

export interface ActivePromo {
  slug: string;
  title: string;
  description: DocumentElement[];
  expiresAt: string | null;
  label: string | null;
  badgeImage: string | null;
  badgeImageAlt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

export const getActivePromo = cache(async (): Promise<ActivePromo | null> => {
  const entries = await reader.collections.promos.all();
  const today = new Date().toISOString().slice(0, 10);

  const live = entries
    .filter((e) => e.entry.active)
    .filter((e) => !e.entry.expiresAt || e.entry.expiresAt >= today)
    .sort((a, b) => {
      if (!a.entry.expiresAt) return 1;
      if (!b.entry.expiresAt) return -1;
      return a.entry.expiresAt.localeCompare(b.entry.expiresAt);
    });

  const promo = live[0];
  if (!promo) return null;

  return {
    slug: promo.slug,
    title: promo.entry.title,
    description: await promo.entry.description(),
    expiresAt: promo.entry.expiresAt,
    label: promo.entry.label || null,
    badgeImage: promo.entry.badgeImage || null,
    badgeImageAlt: promo.entry.badgeImageAlt || null,
    ctaLabel: promo.entry.ctaLabel || null,
    ctaHref: promo.entry.ctaHref || null,
  };
});
```

**Verify**: `pnpm exec tsc --noEmit` → still fails at this point
(`PromoBanner.tsx` hasn't been updated — expected, continue).

### Step 5: Update `components/ui/PromoBanner.tsx`

Replace the badge image's `alt=""` with the new field, and replace the
plain-string description render with `DocumentRenderer`:

```tsx
import Image from "next/image";
import { DocumentRenderer } from "@keystatic/core/renderer";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { buttonVariants } from "@/components/ui/Button";
import { RegistrationMark } from "@/components/ui/RegistrationMark";
import type { ActivePromo } from "@/lib/get-active-promo";

export function PromoBanner({ promo }: { promo: ActivePromo }) {
  return (
    <section
      aria-labelledby="promo-heading"
      className="my-16 border border-foreground/15 px-6 py-8 md:px-10 md:py-10 flex flex-col lg:flex-row lg:items-center gap-6 md:gap-10"
    >
      <div className="flex items-center gap-3 shrink-0">
        {promo.badgeImage ? (
          <div className="relative min-h-40 w-full sm:min-h-52 sm:min-w-52 md:min-h-60 md:min-w-60 shrink-0">
            <Image
              src={promo.badgeImage}
              alt={promo.badgeImageAlt ?? ""}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        ) : (
          <>
            <RegistrationMark className="w-5 h-5 text-gold" />
            <span className="font-mono text-xs uppercase tracking-widest text-text-accent">
              {promo.label || "The Latest News"}
            </span>
          </>
        )}
      </div>

      <div className="flex-1">
        <h2
          id="promo-heading"
          className="font-display font-black uppercase text-4xl md:text-5xl lg:text-6xl leading-none"
        >
          {promo.title}
        </h2>
        {promo.description.length > 0 && (
          <div className="mt-4 text-text-secondary max-w-prose leading-relaxed">
            <DocumentRenderer
              document={promo.description}
              renderers={{
                block: {
                  paragraph: ({ children }) => <p>{children}</p>,
                },
                inline: {
                  link: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-text-accent underline hover:no-underline"
                    >
                      {children}
                    </a>
                  ),
                  bold: ({ children }) => (
                    <strong className="font-bold">{children}</strong>
                  ),
                  italic: ({ children }) => <em>{children}</em>,
                },
              }}
            />
          </div>
        )}
      </div>

      {promo.ctaLabel && promo.ctaHref && (
        <TransitionLink
          href={promo.ctaHref}
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          {promo.ctaLabel}
        </TransitionLink>
      )}
    </section>
  );
}
```

Note `promo.description.length > 0` replaces the old truthy check
(`promo.description &&`) — an empty document is `[]`, not `""`, so the
falsy check no longer applies.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 6: Add an optional `imageAlt` override to the `gallery` collection

In `keystatic.config.ts`, immediately after the `image` field in `gallery`,
add:

```ts
        imageAlt: fields.text({
          label: "Image alt text (optional)",
          description:
            'Overrides the default "<Client> screen print" alt text with something more specific, e.g. "Four-color print on navy crewneck, tour dates on back."',
        }),
```

**Verify**: `grep -n "imageAlt" keystatic.config.ts` → 1 match.

### Step 7: Add `imageAlt` to the 6 existing gallery content files

For each file in `content/gallery/*.json`, add `"imageAlt": ""` (empty —
per "Why this matters," no invented descriptions). Example —
`gallery-item-number-one.json` becomes:

```json
{
  "title": "Gallery Item Number One",
  "client": "Client One",
  "category": "event",
  "image": "/gallery/gallery-item-number-one/image.jpg",
  "imageAlt": "",
  "featured": true,
  "description": "This is the description for Gallery Item Number One",
  "colors": 2,
  "year": 2023
}
```

Do the same for the other 5 files in that directory.

**Verify**: `grep -rc '"imageAlt": ""' content/gallery/*.json | grep -c ':1'`
→ `6`.

### Step 8: Update `lib/get-gallery.ts` and `GalleryItem`

In `components/ui/GalleryGrid.tsx`, add `imageAlt: string | null` to the
`GalleryItem` type:

```ts
export type GalleryItem = {
  slug: string;
  title: string;
  client: string | null;
  category: string;
  image: string | null;
  imageAlt: string | null;
  description: string | null;
  featured: boolean | null;
  colors: number | null;
  year: number | null;
};
```

In `lib/get-gallery.ts`, add the field to the mapping:

```ts
    image: entry.entry.image,
    imageAlt: entry.entry.imageAlt || null,
```

**Verify**: `pnpm exec tsc --noEmit` → fails at this point (the three `alt=`
call sites haven't been updated — expected, continue).

### Step 9: Use `imageAlt` with fallback in the three render call sites

In `components/ui/GalleryGrid.tsx`, `components/ui/FeaturedWorkGrid.tsx`,
and `components/ui/Lightbox.tsx`, replace each instance of:

```tsx
              alt={`${item.client ?? item.title} screen print`}
```

with:

```tsx
              alt={item.imageAlt || `${item.client ?? item.title} screen print`}
```

**Verify**: `grep -rn "item.imageAlt ||" components/ui/GalleryGrid.tsx components/ui/FeaturedWorkGrid.tsx components/ui/Lightbox.tsx`
→ 3 matches (one per file).

### Step 10: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

**Verify**: all four exit 0. `pnpm build` statically renders the homepage
(promo banner + featured gallery) and `/portfolio` (full gallery) — a
successful build confirms the migrated promo content and the new `imageAlt`
fields work end-to-end.

### Step 11: Manual confirmation (optional but recommended)

```bash
pnpm dev
```

Open `http://localhost:3000` — confirm the Cold Side promo banner still
shows the same description text (now rendered via `DocumentRenderer`,
should look visually identical to before). Confirm gallery images on the
homepage and `/portfolio` still show correctly (alt text is not visible
onscreen, but check the browser's accessibility inspector or view-source if
you want to confirm the fallback string is present). Stop the dev server
when done.

## Test plan

No new automated tests — this is a data-shape and rendering change with
existing consumers already exercised by `pnpm build`'s static generation of
the homepage and portfolio pages. That build succeeding against the real,
migrated `content/promos/*.json` and `content/gallery/*.json` is the
load-bearing automated verification.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -n "description: fields.document" keystatic.config.ts` → 1 match
- [ ] `grep -n "badgeImageAlt\|imageAlt" keystatic.config.ts` → 2 matches
- [ ] `grep -rc '"imageAlt": ""' content/gallery/*.json | grep -c ':1'` → `6`
- [ ] `grep -rn "item.imageAlt ||" components/ui/*.tsx` → 3 matches
- [ ] No invented/fabricated alt-text descriptions anywhere in the diff
  (every new `imageAlt`/`badgeImageAlt` value is empty)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Re-entering the promo description through the admin UI (Step 3) throws an
  error or the field won't save — report the exact error; don't hand-write
  a document JSON structure to work around it.
- `promo.entry.description()` (Step 4) doesn't behave as a callable
  function returning a promise — this would mean the `ContentFormField`
  lazy-read assumption (documented in plan 027) doesn't hold for this
  field; report the actual shape rather than guessing an alternative access
  pattern.
- Any of the three `alt=` call sites in Step 9 has drifted from the exact
  string shown in "Current state" — re-read the live file and match its
  actual current expression before replacing it, rather than assuming the
  old text is still there verbatim.

## Maintenance notes

- The `imageAlt` fallback pattern (`item.imageAlt || `${item.client ??
  item.title} screen print`}`) is now the model for any future image field
  that wants an editor-overridable alt text with a sane generated default —
  reuse it rather than inventing a new pattern.
- If more fields end up needing rich text beyond `promos.description` (FAQ
  answers were considered but not included — see the `next`-mode audit this
  plan came from), follow this plan's restricted-feature-set approach
  (explicit `formatting`/`links` allowlist) rather than defaulting to the
  full feature set plan 027's `pages.content` uses — match the guardrail to
  how much the field actually needs, not the maximum available.
