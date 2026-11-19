"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { RegistrationMark } from "./RegistrationMark";
import { Lightbox } from "./Lightbox";
import { StripeOverlay } from "./StripeOverlay";
import { useLightboxGallery } from "@/lib/hooks/useLightboxGallery";

export type GalleryItem = {
  slug: string;
  title: string;
  client: string | null;
  category: string;
  image: string | null;
  imageAlt: string | null;
  images: string[];
  description: string | null;
  featured: boolean | null;
  colors: number | null;
  year: number | null;
};

function formatColors(n: number): string {
  return n === 1 ? "1 color" : `${n} colors`;
}

// ─── Magazine layout sizing ───────────────────────────────────────────────────

type CardSize = "std" | "wide" | "tall";

/**
 * Assigns magazine layout sizes using a positional 5-item repeating cycle.
 * No CMS field needed — pattern is purely algorithmic.
 *
 * Cycle: wide → tall → std → std → std → (repeat)
 *
 * On a 12-col desktop grid this produces two alternating row types:
 *   Row A: wide (8-col landscape) + tall (4-col portrait)  = 12 ✓
 *   Row B: std  (4-col square)    × 3                      = 12 ✓
 *
 * Mobile collapses all sizes to uniform 2-up square cards.
 */
function assignSizes(items: GalleryItem[]): CardSize[] {
  return items.map((_, i) => {
    const pos = i % 5;
    if (pos === 0) return "wide";
    if (pos === 1) return "tall";
    return "std";
  });
}

// Grid: 2-col mobile / 6-col tablet / 12-col desktop
//   md (768-1024px): wide (4) + tall (2) = 6  |  std (2) × 3 = 6
//   lg (1024px+):    wide (6) + tall (3) + std (3) = 12 per editorial row  |  std (3) × 4 = 12
const colSpan: Record<CardSize, string> = {
  std: "col-span-1 md:col-span-2 lg:col-span-3",
  wide: "col-span-1 md:col-span-4 lg:col-span-6",
  tall: "col-span-1 md:col-span-2 lg:col-span-3",
};

// Mobile: all square. Tablet+: wide = landscape, tall = portrait.
const imageAspect: Record<CardSize, string> = {
  std: "aspect-square",
  wide: "aspect-square md:aspect-[4/3]",
  tall: "aspect-square md:aspect-[3/4]",
};

const imageSizes: Record<CardSize, string> = {
  std: "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  wide: "(min-width: 1024px) 50vw, (min-width: 768px) 67vw, 50vw",
  tall: "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
};

// ─── Gallery Card ─────────────────────────────────────────────────────────────

function GalleryCard({
  item,
  index,
  size,
  onOpen,
  triggerRef,
}: {
  item: GalleryItem;
  index: number;
  size: CardSize;
  onOpen: (index: number) => void;
  triggerRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    // group on the outer div so both the image hover and the text color
    // transition respond to hovering anywhere on the card
    <div className={`${colSpan[size]} group`}>
      {/* ── Image frame ─────────────────────────────────────────── */}
      <button
        ref={triggerRef}
        onClick={() => onOpen(index)}
        aria-label={`No. ${String(index + 1).padStart(2, "0")}, view ${item.client ?? item.title}`}
        className="relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div
          className={`relative overflow-hidden bg-ink-3 border border-foreground/15 ${imageAspect[size]}`}
        >
          {/* Photo */}
          {item.image && (
            <Image
              src={item.image}
              alt=""
              fill
              sizes={imageSizes[size]}
              className="object-cover transition-transform duration-slow group-hover:scale-105 motion-reduce:group-hover:scale-100"
            />
          )}

          {/* Diagonal stripe texture — matches FeaturedWorkGrid and hero image */}
          <StripeOverlay opacity={0.12} className="z-10" />

          {/* Index badge — top-left, consistent with FeaturedWorkGrid "No. 01" */}
          <div className="absolute top-3 left-3 z-20 bg-ink border border-foreground/25 px-2 py-0.5">
            <span className="font-mono text-3xs uppercase tracking-widest text-paper/70">
              No.&nbsp;{String(index + 1).padStart(2, "0")}
            </span>
          </div>

          {/* Placeholder when no image */}
          {!item.image && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <RegistrationMark className="w-8 h-8 text-paper/20" />
              <span className="font-mono text-3xs uppercase tracking-widest text-lightbox-text-dim">
                Garment Photo
              </span>
            </div>
          )}

          {/* Hover scrim */}
          <div className="absolute inset-0 z-20 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-300 motion-reduce:transition-none pointer-events-none" />
        </div>
      </button>

      {/* ── Metadata below card ──────────────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-foreground/10 flex flex-col lg:flex-row justify-between lg:items-start lg:gap-3 w-full">
        <p className="font-display uppercase font-black text-text-primary text-lg leading-none group-hover:text-text-accent transition-colors duration-base">
          {item.client ?? item.title}
        </p>
        <div className="text-right shrink-0">
          {item.year && (
            <p className="font-mono text-3xs uppercase tracking-widest text-text-tertiary leading-relaxed">
              {item.year}
            </p>
          )}
          {item.colors && (
            <p className="font-mono text-3xs uppercase tracking-widest text-text-accent">
              {formatColors(item.colors)}
            </p>
          )}
          {item.category && (
            <p className="font-mono text-3xs uppercase tracking-widest text-text-tertiary">
              {item.category.replace(/-/g, " ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── GalleryGrid ──────────────────────────────────────────────────────────────

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const sizes = assignSizes(items);
  const { activeItem, open, close, prev, next, restoreFocus, setTriggerRef } =
    useLightboxGallery(items);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-12 lg:gap-x-6 lg:gap-y-14">
        {items.map((item, index) => (
          <GalleryCard
            key={item.slug}
            item={item}
            index={index}
            size={sizes[index]}
            onOpen={open}
            triggerRef={setTriggerRef(index)}
          />
        ))}
      </div>

      {activeItem &&
        createPortal(
          <Lightbox
            item={activeItem}
            items={items}
            onClose={close}
            onPrev={prev}
            onNext={next}
            onRestoreFocus={restoreFocus}
          />,
          document.body,
        )}
    </>
  );
}
