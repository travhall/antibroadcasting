# Plan 015: Remove dead fields from `site-config.ts` and stop hardcoding the domain

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 240e4f8..HEAD -- lib/site-config.ts app/robots.ts app/sitemap.ts app/layout.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `240e4f8`, 2026-08-07

## Why this matters

`lib/site-config.ts` defines an `openGraph`, `twitter`, `seo`, `analytics`,
`legal`, and `fonts` block, plus `forms.quote.recipientEmail` — none of it is
imported anywhere in the codebase. Meanwhile the two files that actually need
the production domain (`app/robots.ts` and `app/sitemap.ts`) don't use the
`siteConfig.site.url` value this config object exists to provide — they each
hardcode `"https://antibroadcasting.com"` as a separate string literal. This
is exactly the failure mode `plans/README.md` already calls out as an
operational launch risk ("a mismatched domain breaks the sitemap") — except
the fix is currently nowhere wired up, because the canonical value and its
consumers were never connected. Deleting the dead fields removes a false
signal (a maintainer editing `siteConfig.openGraph.images` would reasonably
assume it does something), and pointing `robots.ts`/`sitemap.ts` at
`siteConfig.site.url` collapses three independent copies of the domain string
down to one.

## Current state

- `lib/site-config.ts` — the config object. Full current contents:

```ts
// Developer / infrastructure config only.
// Editorial content (company info, contact, social, SEO, business rules, form options)
// lives in content/site-info.json and is accessed via lib/get-site-info.ts.

export const siteConfig = {
  // Website Configuration
  site: {
    url: "https://antibroadcasting.com",
    baseUrl: "https://antibroadcasting.com",
    domain: "antibroadcasting.com",
    titleTemplate: "%s | Antibroadcasting Inc.",
    language: "en",
    locale: "en_US",
  },

  // Navigation — route definitions belong in code
  navigation: [
    { label: "Portfolio", href: "/portfolio" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],

  // Form server-side config (recipient address used by /api/send)
  forms: {
    quote: {
      recipientEmail: "info@antibroadcasting.com",
    },
  },

  // SEO — crawler directives and verification codes only; keywords/description live in Keystatic
  seo: {
    robots: "index, follow",
    googleVerification: "",
    bingVerification: "",
  },

  // Open Graph — structural config only; title/description/siteName live in Keystatic
  openGraph: {
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Antibroadcasting Inc. Screen Printing",
      },
    ],
  },

  // Twitter Card — structural config only; handle lives in Keystatic social fields
  twitter: {
    card: "summary_large_image",
  },

  // Typography
  fonts: {
    primary: "Figtree",
    mono: "Geist Mono",
    display: "Dominique",
  },

  // Analytics
  analytics: {
    googleAnalyticsId: "",
    googleTagManagerId: "",
    facebookPixelId: "",
  },

  // Legal
  legal: {
    privacyPolicyUrl: "/privacy",
    termsOfServiceUrl: "/terms",
  },
} as const;

export type SiteConfig = typeof siteConfig;
export type NavigationItem = (typeof siteConfig.navigation)[0];
```

- `app/robots.ts` — full current contents:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/keystatic/", "/api/"],
      },
    ],
    sitemap: "https://antibroadcasting.com/sitemap.xml",
  };
}
```

- `app/sitemap.ts` — full current contents:

```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://antibroadcasting.com";

  // Static pages use a pinned date; portfolio stays dynamic since CMS content changes.
  const staticDate = new Date("2026-05-06");

  return [
    { url: base, lastModified: staticDate, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/how-it-works`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.8 },
  ];
}
```

- `app/layout.tsx:29-55` — the only place `siteConfig` fields other than
  `navigation`/`site` are consulted for metadata; it builds `openGraph` and
  `twitter` metadata by hand from `siteInfo` (Keystatic content), not from
  `siteConfig.openGraph`/`siteConfig.twitter`:

```ts
export async function generateMetadata(): Promise<Metadata> {
  const siteInfo = await getSiteInfo();
  return {
    title: {
      default: siteInfo.seo.title,
      template: siteConfig.site.titleTemplate,
    },
    description: siteInfo.seo.description,
    metadataBase: new URL(siteConfig.site.url),
    keywords: siteInfo.seo.keywords,
    alternates: {
      canonical: siteConfig.site.url,
    },
    openGraph: {
      type: "website",
      siteName: siteInfo.company.legalName,
      title: siteInfo.seo.title,
      description: siteInfo.seo.description,
      url: siteConfig.site.url,
    },
    twitter: {
      card: "summary_large_image",
      site: siteInfo.social.twitter.handle,
      creator: siteInfo.social.twitter.handle,
    },
  };
}
```

  Note this file already reads `siteConfig.site.url` and `siteConfig.site.titleTemplate` —
  those two fields (and `navigation`) are the only ones with real callers.
  Confirm this with the grep in Step 1 before deleting anything.

- The real OG image is generated dynamically by `app/opengraph-image.tsx`
  (a Next.js file-convention route) — `siteConfig.openGraph.images` pointing
  at a static `/og-image.jpg` that doesn't exist in `public/` is a leftover
  from before that route existed, not a fallback anything reads.

- The real recipient email for quote requests comes from Keystatic content
  via `siteInfo.forms.quote.emailTo` (see `lib/get-site-info.ts:66` and its
  use in `app/api/send/route.ts:133`) — `siteConfig.forms.quote.recipientEmail`
  is a separate, unused, hardcoded copy of conceptually the same value.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|-------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Build     | `pnpm build`             | exit 0              |
| Lint      | `pnpm lint`              | exit 0              |
| Tests     | `pnpm test`              | all pass            |

## Scope

**In scope**:
- `lib/site-config.ts`
- `app/robots.ts`
- `app/sitemap.ts`

**Out of scope** (do NOT touch, even though they look related):
- `app/layout.tsx` — already correctly uses `siteConfig.site.url` and
  `siteConfig.site.titleTemplate`; no change needed there, only verify it
  still typechecks after the config shape changes.
- `lib/get-site-info.ts` / `content/site-info.json` — the real, live
  editorial config. Not touched by this plan.
- `app/opengraph-image.tsx` — the real OG image generator. Not touched.

## Git workflow

- Branch: `advisor/015-dead-config-and-hardcoded-domain`
- Commit per step; message style follows this repo's conventional-commit
  style seen in `git log` (e.g. `fix: use accessible accent token for nav
  active states in light mode`) — use `refactor:` or `fix:` as appropriate.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm no other callers of the fields you're about to delete

Before deleting anything, grep the whole repo (excluding `node_modules`,
`.next`) for each field you plan to remove, to make sure recon didn't miss a
caller:

```bash
grep -rn "siteConfig\.\(openGraph\|twitter\|seo\|analytics\|legal\|fonts\)\|recipientEmail" \
  --include="*.ts" --include="*.tsx" app components lib
```

**Verify**: the only hit should be the field's own definition inside
`lib/site-config.ts`. If you find a real caller outside that file, STOP —
the "Current state" excerpts have drifted from what recon found; do not
delete that field, report back instead.

### Step 2: Remove the dead fields from `lib/site-config.ts`

Delete the `forms`, `seo`, `openGraph`, `twitter`, `fonts`, `analytics`, and
`legal` blocks from the `siteConfig` object shown in "Current state" above.
Keep `site` and `navigation` — both have live callers. The file should read:

```ts
// Developer / infrastructure config only.
// Editorial content (company info, contact, social, SEO, business rules, form options)
// lives in content/site-info.json and is accessed via lib/get-site-info.ts.

export const siteConfig = {
  // Website Configuration
  site: {
    url: "https://antibroadcasting.com",
    baseUrl: "https://antibroadcasting.com",
    domain: "antibroadcasting.com",
    titleTemplate: "%s | Antibroadcasting Inc.",
    language: "en",
    locale: "en_US",
  },

  // Navigation — route definitions belong in code
  navigation: [
    { label: "Portfolio", href: "/portfolio" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
export type NavigationItem = (typeof siteConfig.navigation)[0];
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0 (this catches any caller
Step 1's grep might have missed, since removed fields become type errors at
their use site).

### Step 3: Wire `app/robots.ts` to `siteConfig.site.url`

Replace the hardcoded sitemap URL with one built from `siteConfig.site.url`:

```ts
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/keystatic/", "/api/"],
      },
    ],
    sitemap: `${siteConfig.site.url}/sitemap.xml`,
  };
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Wire `app/sitemap.ts` to `siteConfig.site.url`

Replace the hardcoded `base` constant:

```ts
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.site.url;

  // Static pages use a pinned date; portfolio stays dynamic since CMS content changes.
  const staticDate = new Date("2026-05-06");

  return [
    { url: base, lastModified: staticDate, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/how-it-works`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: staticDate, changeFrequency: "monthly", priority: 0.8 },
  ];
}
```

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 5: Full verification pass

Run the repo's full verification suite:

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

**Verify**: all four exit 0. The build output should still list the same
route count as before this change (no routes added or removed) — check the
`app/robots.ts`, `app/sitemap.ts` routes are both still present in the build
summary.

## Test plan

No new tests — this is a pure deletion + a same-value substitution
(`"https://antibroadcasting.com"` → `siteConfig.site.url`, which evaluates
to the identical string). Existing behavior is unchanged; `pnpm build`
succeeding and `pnpm test` still passing is sufficient verification. If you
want an extra manual check: after `pnpm build`, inspect the generated
`sitemap.xml`/`robots.txt` output (via `pnpm start` and fetching
`/sitemap.xml`, `/robots.txt`) and confirm the domain still reads
`https://antibroadcasting.com`.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0
- [ ] `grep -rn "openGraph\|twitter\|analytics\|legal:" lib/site-config.ts` returns no matches (only `site` and `navigation` keys remain)
- [ ] `grep -n "https://antibroadcasting.com" app/robots.ts app/sitemap.ts` returns no matches (both now reference `siteConfig.site.url`)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1's grep finds a real caller of any field you were about to delete —
  the field is not actually dead, don't remove it, report which caller you
  found.
- `pnpm exec tsc --noEmit` fails after Step 2 with an error pointing at a
  file not listed in "Current state" — that's a caller recon missed.
- `app/opengraph-image.tsx` turns out to reference `siteConfig.openGraph` —
  recon found no such reference, but if it exists, don't delete that field.

## Maintenance notes

- If real OG image / Twitter card structural config is ever needed again
  (e.g. multiple image variants), re-add it to `siteConfig` at that point,
  driven by an actual caller — don't restore the deleted block speculatively.
- `siteConfig.site.url` is now the single source of truth for the production
  domain across `app/layout.tsx`, `app/robots.ts`, and `app/sitemap.ts`. Any
  future file that needs the domain should import it from here rather than
  hardcoding the string again.
- A reviewer should scrutinize: that the deleted fields truly have zero
  callers (Step 1's grep output), and that the sitemap/robots output is
  byte-identical to before (same domain string, just sourced differently).
