# Plan 025: Extract shared, cached `lib/get-*.ts` readers for gallery/FAQ/art-requirements

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 25b2392..HEAD -- 'app/(site)/page.tsx' 'app/(site)/portfolio/page.tsx' 'app/(site)/how-it-works/page.tsx' lib`
> This plan assumes plan `023-array-fields-for-list-content.md` has already
> landed (`artRequirements.items` reads as `string[]`, not a newline-joined
> string — baked into the "Current state" below). If that plan hasn't run
> yet, or any in-scope file otherwise differs from the excerpts below, treat
> it as a STOP condition and re-read the live file before proceeding.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `023-array-fields-for-list-content.md`
- **Category**: tech-debt
- **Planned at**: commit `25b2392`, 2026-08-09

## Why this matters

Two Keystatic collections (`gallery`, `faq`) and one more (`artRequirements`)
are queried directly with `reader.collections.<name>.all()` inline inside
page components — `app/(site)/page.tsx:32`, `app/(site)/portfolio/page.tsx:38`,
and `app/(site)/how-it-works/page.tsx:58-59` — each with its own copy of the
entry-to-plain-object mapping logic. `page.tsx` and `portfolio/page.tsx` map
`gallery` entries into an *identical* shape (`slug`, `title`, `client`,
`category`, `image`, `description`, `featured`, `colors`, `year`) via two
separately-written `.map()` calls. Meanwhile the other two Keystatic-backed
data sources in this codebase, `promos` and `siteInfo`, are wrapped in
`lib/get-active-promo.ts` and `lib/get-site-info.ts` — both wrapped in React's
`cache()`, both the single place their mapping logic lives. This plan brings
`gallery`, `faq`, and `artRequirements` in line with that established
pattern: one cached reader function per collection, one mapping definition,
reused by every page that needs it.

`cache()` (from `react`) deduplicates identical calls within a single render
pass — currently harmless here since each page only calls its collection
once, but it's the difference between "coincidentally fine" and "actually
guaranteed," and matches the codebase's own existing convention for the
other two Keystatic sources.

## Current state

`components/ui/GalleryGrid.tsx:9-18` — the canonical `GalleryItem` shape,
already exported and reused by `FeaturedWorkGrid.tsx`:

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

`app/(site)/page.tsx:29-46` — `getFeaturedWork`, one of the two duplicate
gallery mappings:

```ts
async function getFeaturedWork() {
  const entries = await reader.collections.gallery.all();
  return entries
    .filter((e) => e.entry.featured)
    .map((e) => ({
      slug: e.slug,
      title: e.entry.title,
      client: e.entry.client,
      category: e.entry.category ?? "",
      image: e.entry.image,
      description: e.entry.description ?? null,
      featured: e.entry.featured,
      colors: e.entry.colors,
      year: e.entry.year,
    }));
}
```

`app/(site)/portfolio/page.tsx:38-50` — the other duplicate:

```ts
  const galleryEntries = await reader.collections.gallery.all();

  const allItems = galleryEntries.map((entry) => ({
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
```

`app/(site)/how-it-works/page.tsx:56-85` — the FAQ and art-requirements
reads and mappings (shown with plan 023 already applied — `items` is
`string[]`):

```ts
export default async function HowItWorksPage() {
  const [faqEntries, artEntries] = await Promise.all([
    reader.collections.faq.all(),
    reader.collections.artRequirements.all(),
  ]);

  const artSections = artEntries
    .map((entry) => ({
      heading: entry.entry.heading,
      items: entry.entry.items ?? [],
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order);

  const items = faqEntries
    .map((entry) => ({
      slug: entry.slug,
      question: entry.entry.question,
      answer: entry.entry.answer,
      category: entry.entry.category,
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => {
      if (a.category !== b.category)
        return a.category.localeCompare(b.category);
      return a.order - b.order;
    });
```

`lib/get-active-promo.ts` — the existing pattern to match (full contents):

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";

export interface ActivePromo { /* ... */ }

export const getActivePromo = cache(async (): Promise<ActivePromo | null> => {
  const entries = await reader.collections.promos.all();
  // ...filter/sort/map...
});
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Build     | `pnpm build`               | exit 0              |
| Tests     | `pnpm test`                | all pass            |

## Scope

**In scope**:
- `lib/get-gallery.ts` (new)
- `lib/get-faq.ts` (new)
- `lib/get-art-requirements.ts` (new)
- `app/(site)/page.tsx`
- `app/(site)/portfolio/page.tsx`
- `app/(site)/how-it-works/page.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `lib/get-active-promo.ts`, `lib/get-site-info.ts` — already follow the
  target pattern, used here only as a reference example, not modified.
- `components/ui/GalleryGrid.tsx`, `FeaturedWorkGrid.tsx`, `FaqAccordion.tsx`
  — their prop types are unchanged by this plan (`GalleryItem` is reused
  as-is; the FAQ/art-requirements shapes returned by the new lib functions
  match what these components already receive).
- `keystatic.config.ts` — no schema change in this plan.

## Git workflow

- Branch: `advisor/025-shared-cached-collection-readers`
- Commit message style follows this repo's conventional-commit style seen in
  `git log` — use `refactor:`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `lib/get-gallery.ts`

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

The `import type` is deliberate — `GalleryGrid.tsx` is a `"use client"`
component, but a type-only import is erased at compile time and does not
pull the client component into this server-only module's bundle.

**Verify**: `pnpm exec tsc --noEmit` → new errors only in files not yet
updated (expected at this point — continue to the next steps).

### Step 2: Create `lib/get-faq.ts`

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";

export interface FaqItem {
  slug: string;
  question: string;
  answer: string;
  category: string;
}

export const getFaq = cache(async (): Promise<FaqItem[]> => {
  const entries = await reader.collections.faq.all();
  return entries
    .map((entry) => ({
      slug: entry.slug,
      question: entry.entry.question,
      answer: entry.entry.answer,
      category: entry.entry.category,
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.order - b.order;
    })
    .map(({ slug, question, answer, category }) => ({ slug, question, answer, category }));
});
```

Note `order` is used for sorting inside this function but dropped from the
returned shape — `components/ui/FaqAccordion.tsx`'s `FaqItem` type
(`slug`, `question`, `answer`, `category`) never included it; match that
exactly.

**Verify**: `pnpm exec tsc --noEmit` → no new errors in this file.

### Step 3: Create `lib/get-art-requirements.ts`

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";

export interface ArtRequirementSection {
  heading: string;
  items: string[];
}

export const getArtRequirements = cache(async (): Promise<ArtRequirementSection[]> => {
  const entries = await reader.collections.artRequirements.all();
  return entries
    .map((entry) => ({
      heading: entry.entry.heading,
      items: entry.entry.items ?? [],
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ heading, items }) => ({ heading, items }));
});
```

**Verify**: `pnpm exec tsc --noEmit` → no new errors in this file.

### Step 4: Update `app/(site)/page.tsx` to use `getGallery`

Remove the `getFeaturedWork` function entirely and its `reader` import (check
first whether `reader` is used elsewhere in this file — it is not, per
"Current state"). Add:

```ts
import { getGallery } from "@/lib/get-gallery";
```

In the `Home` component, replace:

```ts
  const [featuredWork, siteInfo, activePromo] = await Promise.all([
    getFeaturedWork(),
    getSiteInfo(),
    getActivePromo(),
  ]);
```

with:

```ts
  const [gallery, siteInfo, activePromo] = await Promise.all([
    getGallery(),
    getSiteInfo(),
    getActivePromo(),
  ]);
  const featuredWork = gallery.filter((item) => item.featured);
```

**Verify**: `grep -n "reader\." "app/(site)/page.tsx"` → no matches.
`pnpm exec tsc --noEmit` → no errors in this file.

### Step 5: Update `app/(site)/portfolio/page.tsx` to use `getGallery`

Remove the `import { reader } from "@/lib/keystatic";` line. Add:

```ts
import { getGallery } from "@/lib/get-gallery";
```

Replace:

```ts
  const galleryEntries = await reader.collections.gallery.all();

  const allItems = galleryEntries.map((entry) => ({
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
```

with:

```ts
  const allItems = await getGallery();
```

**Verify**: `grep -n "reader\." "app/(site)/portfolio/page.tsx"` → no matches.
`pnpm exec tsc --noEmit` → no errors in this file.

### Step 6: Update `app/(site)/how-it-works/page.tsx` to use `getFaq`/`getArtRequirements`

Remove the `import { reader } from "@/lib/keystatic";` line. Add:

```ts
import { getFaq } from "@/lib/get-faq";
import { getArtRequirements } from "@/lib/get-art-requirements";
```

Replace:

```ts
  const [faqEntries, artEntries] = await Promise.all([
    reader.collections.faq.all(),
    reader.collections.artRequirements.all(),
  ]);

  const artSections = artEntries
    .map((entry) => ({
      heading: entry.entry.heading,
      items: entry.entry.items ?? [],
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order);

  const items = faqEntries
    .map((entry) => ({
      slug: entry.slug,
      question: entry.entry.question,
      answer: entry.entry.answer,
      category: entry.entry.category,
      order: entry.entry.order ?? 99,
    }))
    .sort((a, b) => {
      if (a.category !== b.category)
        return a.category.localeCompare(b.category);
      return a.order - b.order;
    });
```

with:

```ts
  const [items, artSections] = await Promise.all([
    getFaq(),
    getArtRequirements(),
  ]);
```

Both `items` and `artSections` are already sorted by the new lib functions
(the sort logic moved there unchanged) — the rest of the component (the
`faqJsonLd` construction, `artSections.map(...)` rendering, `FaqAccordion`
usage) needs no further change since the shapes match what it already
consumed.

**Verify**: `grep -n "reader\." "app/(site)/how-it-works/page.tsx"` → no
matches. `pnpm exec tsc --noEmit` → no errors in this file.

### Step 7: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
```

**Verify**: all three exit 0. `pnpm build` statically renders the homepage,
`/portfolio`, and `/how-it-works` — a successful build confirms the three new
lib functions produce output the pages can render without error.

### Step 8: Manual confirmation (optional but recommended)

```bash
pnpm dev
```

Open `http://localhost:3000` and confirm "Featured Work" still shows the
same items as before. Open `http://localhost:3000/portfolio` and confirm the
full gallery and category filters still work. Open
`http://localhost:3000/how-it-works` and confirm FAQ and art-requirements
sections render identically. Stop the dev server when done.

## Test plan

No new automated tests — this is a pure extraction (same mapping logic,
moved and deduplicated) with an unchanged rendered shape on every consuming
page. `pnpm build` succeeding against the real content files, rendering all
three pages at build time, is the load-bearing automated verification.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -rn "reader\.collections\.\(gallery\|faq\|artRequirements\)" "app/(site)"` returns no matches (all three collections now go through `lib/get-*.ts`)
- [ ] `lib/get-gallery.ts`, `lib/get-faq.ts`, `lib/get-art-requirements.ts` exist and each wraps its `reader.collections.*.all()` call in `cache(...)`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 023 hasn't landed and `artRequirements.items` is still a
  newline-joined string, not `string[]` — keep the `.split("\n").map(...).filter(...)`
  logic inside `lib/get-art-requirements.ts` instead of the `?? []` shown
  here, matching whatever the live field type actually is.
- `pnpm build` fails after Steps 4-6 with a type mismatch between a page's
  usage and a new lib function's return type — report the exact mismatch
  rather than loosening types to force a pass.
- Any consuming component (`GalleryGrid`, `FeaturedWorkGrid`, `FaqAccordion`)
  turns out to expect a field this plan's mapping omits — report it; don't
  guess at adding a field not present in "Current state".

## Maintenance notes

- Any future Keystatic collection consumed by more than one page should get
  its own `lib/get-*.ts` wrapper from the start, following this same
  pattern (`cache()`-wrapped, one mapping definition) — don't reintroduce
  inline `reader.collections.*.all()` calls in page components.
- If `gallery`, `faq`, or `artRequirements` schemas change in
  `keystatic.config.ts`, the corresponding `lib/get-*.ts` file is now the
  single place to update the mapping — not three call sites.
