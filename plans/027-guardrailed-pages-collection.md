# Plan 027: Add a guardrailed `pages` collection for one-off content

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d479ad9..HEAD -- keystatic.config.ts 'app/(site)'`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED (new collection type, new field type not used elsewhere in
  this schema, new dynamic route — more surface area than the 021-026 batch)
- **Depends on**: none
- **Category**: direction (feature)
- **Planned at**: commit `d479ad9`, 2026-08-10

## Why this matters

Every current Keystatic collection (`gallery`, `faq`, `artRequirements`,
`promos`) is a fixed, purpose-built list — none of them let an editor
publish an arbitrary one-off page. This is a real, observed gap: the "Cold
Side" promo banner on the homepage wants a CTA linking to a dedicated
announcement page about the acquisition, but no such page exists, so its
`ctaHref` currently points at the generic `/about` page instead (see
`content/promos/coldside-is-now-a-part-of-antibroadcasting.json:6` and the
commit that set it, `7225ef3`, "Update Cold Side promo with call-to-action
label and link"). Today, publishing a real one-off page requires a developer
to hand-write a new file under `app/(site)/`, wire up metadata, and deploy —
there's no CMS-only path.

This plan adds a `pages` collection so the site owner can publish this kind
of content themselves, with two deliberate guardrails so it can't become an
unbounded page-builder:

1. **A fixed URL namespace.** Pages render at `/updates/<slug>`, never at
   the top level. This makes collisions with real routes (`/about`,
   `/contact`, `/portfolio`, etc.) structurally impossible — a new page
   published tomorrow can never accidentally shadow an existing static
   route, and the URL pattern itself signals "this is an ad-hoc update,"
   not "this is primary site navigation."
2. **A restricted rich-text editor**, `fields.document()`, configured with
   only a narrow feature subset (bold/italic, links, lists, headings 2-3,
   one restricted image type). No raw HTML, no embeds, no custom component
   blocks, no tables, no dividers — an editor cannot produce markup outside
   what this plan explicitly enables.

**A note on `fields.document`**: this field is marked `@deprecated` in the
installed `@keystatic/core@0.6.4` types ("`fields.markdoc` has superseded
this field. `fields.mdx` is also available") — see
`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/declarations/src/form/fields/document/index.d.ts`.
This plan uses it anyway, deliberately: it's still fully functional in the
installed version, its `DocumentRenderer` ships in the same package with no
extra dependency, and its `DocumentFeaturesConfig` is exactly the toggle-based
guardrail mechanism this plan needs. `fields.markdoc`/`fields.mdx` are the
"current" alternatives, but adopting either would mean a new dependency
(`@markdoc/markdoc` or an MDX toolchain) and hand-writing a render pipeline
that hasn't been verified end-to-end here. If `fields.document` is ever
removed in a future Keystatic major version, migrating to `fields.markdoc`
at that point is a contained, well-scoped follow-up — not a reason to take
on unverified complexity now.

## Current state

`keystatic.config.ts:15-133` — the `collections` block ends after `promos`;
there is no `pages` collection. Full current file was reviewed this session;
key structural facts:

- Every existing collection uses `format: { data: "json" }` (plain JSON,
  no separate content-body file).
- `content/` directory layout: `content/gallery/*.json`,
  `content/faq/*.json`, `content/art-requirements/*.json`,
  `content/promos/*.json`, `content/site-info.json` — flat, one JSON file
  per entry per collection.

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/declarations/src/form/fields/document/index.d.ts`
confirms the field signature:

```ts
export declare function document({ label, componentBlocks, description, ...documentFeaturesConfig }: {
  label: string;
  componentBlocks?: Record<string, ComponentBlock>;
  description?: string;
} & DocumentFeaturesConfig): ContentFormField<DocumentElement[], DocumentElement[], DocumentElement[]>;
```

where `DocumentFeaturesConfig` (same file) is:

```ts
type DocumentFeaturesConfig = {
  formatting?: true | FormattingConfig;
  links?: true;
  dividers?: true;
  images?: true | { directory?: string; publicPath?: string; schema?: { alt?: BasicStringFormField; title?: BasicStringFormField } };
  layouts?: readonly (readonly [number, ...number[]])[];
  tables?: true;
};
```

`links`, `dividers`, and `tables` only accept the literal `true` — omitting
a key disables that feature entirely. There is no `false` variant; disabling
means not setting the key.

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/keystatic-core-renderer.d.ts`
confirms `DocumentRenderer`'s exported shape (relevant excerpt):

```ts
export type DocumentRendererProps<ComponentBlocks = ...> = {
  document: Element[]; // Element = { children: Node[]; [key: string]: unknown }
  renderers?: { inline?: Partial<Renderers['inline']>; block?: Partial<Renderers['block']> };
  componentBlocks?: ComponentBlocks;
};
export declare function DocumentRenderer<...>(props: DocumentRendererProps<...>): JSX.Element;
```

Imported from the `@keystatic/core/renderer` subpath export (confirmed in
`@keystatic/core`'s `package.json` `exports` map — a Node-safe, non-React-server
build is available at that path).

`DocumentElement` (the type of a document field's read value) is exported
from the package root — `node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/declarations/src/form/api.d.ts:159-160`,
re-exported via `@keystatic/core`'s `export * from "./form/api.js"`.

Content-field values (what `fields.document` produces) read back as a
**lazy function**, not a plain value — confirmed via the `ValueForReading`
conditional type (`.../form/api.d.ts`): a `ContentFormField`'s value resolves
to `() => Promise<Value>`. This means a `pages` entry's `content` field is
`() => Promise<DocumentElement[]>` — it must be **called and awaited**, not
read directly.

**Correction (verified against `.../declarations/src/reader/generic.d.ts`
and the compiled `.../dist/generic-*.node.js`, `read`/`all` functions):**
`reader.collections.<name>.read(slug)` and `reader.collections.<name>.all()`
do **not** have the same return shape. `.all()` wraps each item as
`{ slug: string; entry: { ...schema fields... } }` — the `.entry` wrapper
exists only there. `.read(slug)` returns the flat schema object directly
(`{ ...schema fields... } | null`), with **no** `.entry` wrapper. So for a
`pages` entry: `await reader.collections.pages.all()` → items shaped like
`entry.entry.title`, `entry.entry.published` (used correctly in Step 2's
`getPages`) — but `await reader.collections.pages.read(slug)` → a value
shaped like `page.title`, `page.published`, `page.content()`,
`page.metaDescription` directly, **not** `page.entry.title` etc. Step 3
below reflects this corrected shape.

`app/(site)/about/page.tsx` (excerpt) — the layout pattern every interior
page follows, to match:

```tsx
import type { Metadata } from "next";
import { getSiteInfo } from "@/lib/get-site-info";
import { siteConfig } from "@/lib/site-config";
import { PageBreadcrumb } from "@/components/ui/PageBreadcrumb";

export async function generateMetadata(): Promise<Metadata> {
  // ...builds title/description/canonical from siteConfig.site.url
}
```

`components/ui/PageBreadcrumb.tsx` — full contents already reviewed this
session; takes a single `page: string` label prop and renders a "Home / X"
breadcrumb — reuse as-is, no changes needed.

`app/(site)/layout.tsx` exists and wraps every route under the `(site)`
route group with the shared header/footer chrome — a new route under
`app/(site)/updates/[slug]/page.tsx` inherits it automatically, no extra
wiring required.

`lib/get-gallery.ts` (from a prior plan, already merged) — the established
pattern for a cached collection reader in this codebase:

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";
import type { GalleryItem } from "@/components/ui/GalleryGrid";

export const getGallery = cache(async (): Promise<GalleryItem[]> => {
  const entries = await reader.collections.gallery.all();
  return entries.map((entry) => ({ /* ... */ }));
});
```

`node_modules/.pnpm/@keystatic+core@0.6.4*/node_modules/@keystatic/core/dist/keystatic-core-reader.js`
confirms the reader exposes a per-collection `async read(slug)` method
alongside `.all()` (grepped `async read` in the compiled source) — this
project already uses the singleton form, `reader.singletons.siteInfo.read()`
(no args); the collection form takes the slug: `reader.collections.pages.read(slug)`.

Next.js version: 16.2.9 (confirmed via `pnpm build` output this session) —
dynamic route `params` are async (`Promise<{ slug: string }>`), must be
awaited in both `generateMetadata` and the page component.

No `@tailwindcss/typography` plugin is installed (`grep -n "typography"
package.json` — no match) — do **not** use a `prose` class on rendered
document output; it doesn't exist in this project. Style the renderer's
`block`/`inline` overrides directly using this project's existing
typography tokens (see Step 3).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Build     | `pnpm build`               | exit 0              |
| Tests     | `pnpm test`                | all pass            |
| Lint      | `pnpm lint`                | exit 0              |

## Scope

**In scope**:
- `keystatic.config.ts` (add the `pages` collection)
- `lib/get-pages.ts` (new)
- `app/(site)/updates/[slug]/page.tsx` (new)
- `content/pages/` (new, empty directory — no seed content; see Step 4)

**Out of scope** (do NOT touch, even though they look related):
- Any existing collection (`gallery`, `faq`, `artRequirements`, `promos`) or
  the `siteInfo` singleton — untouched by this plan.
- Retrofitting `promos.description` to rich text, or adding alt-text fields
  — that's a separate plan (`028-promo-description-and-alt-text.md`).
- A preview/draft-mode UI for unpublished pages — flagged as a future
  enhancement in "Maintenance notes" below, not built here. `published:
  false` (the default) already fully gates visibility (route 404s, and the
  page is excluded from `generateStaticParams`) — that's the guardrail for
  now; a live preview of unpublished content is future work.
- Component blocks (`fields.document`'s `componentBlocks` option) —
  deliberately omitted; adding one later is itself a scoped follow-up, not
  something to speculatively wire up now.
- The site's global navigation (`lib/site-config.ts`'s `navigation` array)
  — published pages are reachable by direct URL and by whatever links to
  them (e.g. a promo's `ctaHref`), not added to primary nav. If the site
  owner wants a published page listed in nav, that's a manual, deliberate
  edit to `site-config.ts` — out of scope for this plan to automate.

## Git workflow

- Branch: `advisor/027-guardrailed-pages-collection`
- Commit message style follows this repo's conventional-commit style seen in
  `git log` — use `feat:`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the `pages` collection to `keystatic.config.ts`

Inside the `collections` object, after the `promos` collection's closing
`}),` and before the `collections` object's own closing `},`, add:

```ts
    pages: collection({
      label: "Pages",
      slugField: "title",
      path: "content/pages/*",
      format: { data: "json" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        content: fields.document({
          label: "Content",
          formatting: {
            inlineMarks: { bold: true, italic: true },
            listTypes: true,
            headingLevels: [2, 3],
          },
          links: true,
          images: {
            directory: "public/pages",
            publicPath: "/pages",
            schema: {
              alt: fields.text({
                label: "Alt text",
                validation: { isRequired: true },
              }),
            },
          },
        }),
        metaDescription: fields.text({
          label: "Meta description",
          description: 'Used in <meta name="description"> and Open Graph.',
          multiline: true,
        }),
        published: fields.checkbox({
          label: "Published",
          description: "Unpublished pages return 404 on the live site.",
          defaultValue: false,
        }),
      },
    }),
```

Note what's deliberately absent from `formatting`: `alignment`, `blockTypes`
(blockquote/code), and `softBreaks` are all omitted (disabled). `dividers`,
`tables`, and `layouts` are omitted at the top level (disabled). No
`componentBlocks`. This is the guardrail — re-read "Why this matters" before
changing any of these.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Create `lib/get-pages.ts`

```ts
import { cache } from "react";
import { reader } from "@/lib/keystatic";

export interface PageSummary {
  slug: string;
  title: string;
  published: boolean;
}

export const getPages = cache(async (): Promise<PageSummary[]> => {
  const entries = await reader.collections.pages.all();
  return entries.map((entry) => ({
    slug: entry.slug,
    title: entry.entry.title,
    published: entry.entry.published,
  }));
});

export const getPage = cache(async (slug: string) => {
  return reader.collections.pages.read(slug);
});
```

`getPage` intentionally returns the raw reader entry (not a reshaped object)
— its `content` field is the lazy `() => Promise<DocumentElement[]>`
function described in "Current state," and the route component needs to
call it directly.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: Create `app/(site)/updates/[slug]/page.tsx`

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentRenderer } from "@keystatic/core/renderer";
import { siteConfig } from "@/lib/site-config";
import { getPage, getPages } from "@/lib/get-pages";
import { PageBreadcrumb } from "@/components/ui/PageBreadcrumb";

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.filter((p) => p.published).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || !page.published) return {};

  return {
    title: page.title,
    description: page.metaDescription || undefined,
    alternates: { canonical: `${siteConfig.site.url}/updates/${slug}` },
    openGraph: {
      title: page.title,
      description: page.metaDescription || undefined,
      url: `${siteConfig.site.url}/updates/${slug}`,
    },
  };
}

export default async function UpdatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || !page.published) notFound();

  const content = await page.content();

  return (
    <div className="w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto">
      <section className="pt-10 pb-20">
        <PageBreadcrumb page={page.title} />

        <h1 className="font-display font-black uppercase leading-[0.85] text-[clamp(3rem,8vw,6rem)] mb-10">
          {page.title}
        </h1>

        <div className="max-w-[70ch]">
          <DocumentRenderer
            document={content}
            renderers={{
              block: {
                paragraph: ({ children }) => (
                  <p className="text-text-secondary leading-relaxed mb-6">
                    {children}
                  </p>
                ),
                heading: ({ level, children }) => {
                  const Tag = `h${level}` as "h2" | "h3";
                  return (
                    <Tag className="font-display font-black uppercase text-text-primary mt-10 mb-4">
                      {children}
                    </Tag>
                  );
                },
                list: ({ type, children }) => {
                  const Tag = type === "ordered" ? "ol" : "ul";
                  return (
                    <Tag className="list-disc list-inside text-text-secondary leading-relaxed mb-6 flex flex-col gap-2">
                      {children}
                    </Tag>
                  );
                },
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
      </section>
    </div>
  );
}
```

`heading`'s `level` is typed `1 | 2 | 3 | 4 | 5 | 6` by `DocumentRenderer`,
but the schema only ever produces 2 or 3 (per Step 1's `headingLevels: [2,
3]`) — the `"h2" | "h3"` cast reflects that constraint; if `tsc` disagrees,
widen the cast to `"h2" | "h3" | "h4" | "h5" | "h6"` rather than `any`.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Create the (empty) content directory

```bash
mkdir -p content/pages
touch content/pages/.gitkeep
```

No seed content — this plan ships the *capability*, not a first page. The
site owner creates pages through the Keystatic admin UI once this lands.
Git does not track empty directories; `.gitkeep` is the standard placeholder
so `content/pages/` exists in the repo for Keystatic's `path: "content/pages/*"`
to resolve against before any real entry exists.

**Verify**: `ls content/pages/.gitkeep` → file exists.

### Step 5: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

**Verify**: all four exit 0. `pnpm build`'s route table should now include
`app/(site)/updates/[slug]/page.tsx` — with zero published pages,
`generateStaticParams` returns `[]`, so this route generates no static
pages at build time (that's correct — nothing to prerender yet) but must
still compile and appear as a valid dynamic route.

### Step 6: Manual confirmation (required — this plan ships an empty collection)

```bash
pnpm dev
```

1. Open `http://localhost:3000/keystatic/collection/pages` — confirm the
   collection appears with the expected fields, and the "Content" field
   renders as a rich-text editor with only bold/italic/links/lists/headings
   2-3/a restricted image type available in its toolbar (no table, divider,
   blockquote, or code-block buttons).
2. Create one throwaway test entry: title "Test Page," some body text with
   a link and a heading, leave `published` unchecked. Save.
3. Visit `http://localhost:3000/updates/test-page` — confirm it 404s
   (unpublished).
4. Go back to the admin UI, check `published`, save. Reload
   `http://localhost:3000/updates/test-page` — confirm it now renders the
   title, breadcrumb, and formatted body content matching what was
   authored.
5. **Delete the test entry** (`content/pages/test-page.json`, plus its
   `.gitkeep`-adjacent directory stays) before finishing — this plan ships
   an empty collection, not a test fixture.

Stop the dev server when done.

## Test plan

No new automated tests — this is new infrastructure with no existing
behavior to characterize, and the content is empty by design (Step 4). The
manual walkthrough in Step 6 is the load-bearing verification, since it's
the only way to observe the restricted rich-text editor's toolbar and the
publish/unpublish gating end-to-end. `pnpm build` succeeding with zero
content (Step 5) is the automated proof the route compiles correctly with
an empty collection.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -n "pages: collection" keystatic.config.ts` → 1 match
- [ ] `test -f lib/get-pages.ts && test -f "app/(site)/updates/[slug]/page.tsx"` → both exist
- [ ] `ls content/pages/` → contains only `.gitkeep` (no leftover test entries)
- [ ] Manual walkthrough (Step 6) completed and passed
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `reader.collections.pages.read(slug)` doesn't exist or has a different
  signature than assumed — re-check the compiled reader source at the path
  in "Current state" and report the actual API instead of guessing an
  alternative.
- `DocumentRenderer`'s `renderers.block.heading` or `.list` prop shapes
  don't match what Step 3 assumes — report the actual prop types from
  `keystatic-core-renderer.d.ts` rather than casting around a mismatch.
- Creating a `pages` entry in the admin UI (Step 6) throws a runtime error —
  this would mean an assumption about `fields.document`'s standalone use in
  a `format: { data: "json" }` collection (as opposed to requiring
  `format.contentField`) was wrong; report the exact error rather than
  restructuring the collection's format to work around it.

## Maintenance notes

- **Preview/draft mode** (deferred from this plan, per user decision): right
  now `published: false` is the only gate — there's no way to view an
  unpublished page's rendered output without flipping `published` to `true`
  first (or running locally and manually editing the flag). If this becomes
  a real workflow pain once the site owner is actively using this
  collection, the natural next step is a signed-preview-token route (e.g.
  `/updates/[slug]?preview=<token>` bypassing the `published` check for a
  single request) — deliberately not built now, revisit after the Pages
  collection has been used for a while and the actual pain point (if any)
  is concrete.
- If a second dynamic content type is ever needed (e.g. a blog), don't
  duplicate this pattern under a new namespace by copy-paste — extend the
  `pages` collection's schema (e.g. a `category` or `type` field) before
  reaching for a second collection, unless the two content types genuinely
  need different guardrails.
- `fields.document`'s deprecation (see "Why this matters") means a future
  Keystatic major version could remove it. If that happens, the migration
  path is `fields.markdoc`, which will need its own new dependency
  (`@markdoc/markdoc`) and a hand-written render pipeline — budget that as
  real work, not a drop-in swap, when it comes up.
