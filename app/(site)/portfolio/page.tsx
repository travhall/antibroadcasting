import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { getGallery } from "@/lib/get-gallery";
import { GalleryGrid } from "@/components/ui/GalleryGrid";
import { RegistrationMark } from "@/components/ui/RegistrationMark";
import { CtaBand } from "@/components/ui/CtaBand";
import Link from "next/link";
import { PageBreadcrumb } from "@/components/ui/PageBreadcrumb";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Browse our screen printing work — bands, artists, and events across Minneapolis and beyond.",
  alternates: { canonical: `${siteConfig.site.url}/portfolio` },
  openGraph: {
    title: "Portfolio | Antibroadcasting Inc.",
    description:
      "Browse our screen printing work — bands, artists, and events across Minneapolis and beyond.",
    url: `${siteConfig.site.url}/portfolio`,
  },
};

function formatCategoryLabel(value: string): string {
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = category ?? "all";

  const allItems = await getGallery();

  const categoryValues = Array.from(
    new Set(allItems.map((i) => i.category).filter(Boolean)),
  ).sort();

  const categories = [
    { label: "All Work", value: "all" },
    ...categoryValues.map((v) => ({ label: formatCategoryLabel(v), value: v })),
  ];

  const filteredItems =
    activeCategory === "all"
      ? allItems
      : allItems.filter((item) => item.category === activeCategory);

  return (
    <>
      {/* ── Constrained wrapper ───────────────────────────────────────── */}
      <div className="w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="py-10 border-b border-foreground/10">
          <PageBreadcrumb page="Portfolio" />

          <h1 className="font-display font-black uppercase leading-[0.85] text-[clamp(5rem,18vw,12rem)]">
            Our Work<span className="text-gold">.</span>
          </h1>
        </section>

        {/* ── Category filter ───────────────────────────────────────── */}
        {categoryValues.length > 0 && (
          <div className="py-8 flex flex-wrap items-center gap-3 border-b border-foreground/10">
            <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary shrink-0 mr-2">
              Filter
            </span>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.value;
              const count =
                cat.value === "all"
                  ? allItems.length
                  : allItems.filter((i) => i.category === cat.value).length;
              return (
                <Link
                  key={cat.value}
                  href={
                    cat.value === "all"
                      ? "/portfolio"
                      : `?category=${cat.value}`
                  }
                  aria-current={isActive ? "true" : undefined}
                  className={`inline-flex items-center gap-2 min-h-11 px-4 py-1.5 font-mono text-xs uppercase tracking-widest border transition-colors ${
                    isActive
                      ? "bg-gold text-ink border-gold"
                      : "bg-transparent text-text-secondary border-foreground/20 hover:border-gold hover:text-text-accent"
                  }`}
                >
                  {cat.label}
                  <span
                    className={`text-3xs ${
                      isActive ? "text-ink/70" : "text-text-tertiary"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
            {activeCategory !== "all" && (
              <span className="font-mono text-xs text-text-tertiary ml-auto">
                {filteredItems.length} result
                {filteredItems.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* ── Gallery ───────────────────────────────────────────────── */}
        <div className="py-8">
          {filteredItems.length > 0 ? (
            <GalleryGrid items={filteredItems} />
          ) : (
            <EmptyState category={activeCategory} categories={categories} />
          )}
        </div>
      </div>

      {/* ── CTA — full-bleed ──────────────────────────────────────── */}
      <CtaBand
        heading={
          <>
            Like What
            <br />
            You See?
          </>
        }
        description="We print for bands, artists, events, and businesses across Minneapolis. Let's talk about your project."
        primaryCta={{ label: "Get a Quote", href: "/contact" }}
        secondaryCta={{ label: "How It Works", href: "/how-it-works" }}
      />
    </>
  );
}

function EmptyState({
  category,
  categories,
}: {
  category: string;
  categories: { label: string; value: string }[];
}) {
  const label =
    categories.find((c) => c.value === category)?.label ?? "this category";

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <RegistrationMark className="w-12 h-12 text-foreground/10 mb-8" />
      <h2 className="font-display font-black uppercase text-2xl text-text-primary mb-2">
        Nothing Here Yet<span className="text-gold">.</span>
      </h2>
      <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary max-w-xs leading-relaxed">
        {category === "all"
          ? "Portfolio images will appear here once they've been added to the CMS."
          : `No ${label.toLowerCase()} work has been added yet.`}
      </p>
      {category !== "all" && (
        <Link
          href="/portfolio"
          className="mt-8 font-mono text-xs uppercase tracking-widest text-text-accent hover:text-text-primary transition-colors"
        >
          ← View All Work
        </Link>
      )}
    </div>
  );
}
