"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { RegistrationMark } from "./RegistrationMark";
import type { GalleryItem } from "./GalleryGrid";
import { Lightbox } from "./Lightbox";
import { StripeOverlay } from "./StripeOverlay";
import { useLightboxGallery } from "@/lib/hooks/useLightboxGallery";

// ─── Grid ─────────────────────────────────────────────────────────────────────

const aspectClasses = ["aspect-[3/4]", "aspect-[2/3]", "aspect-[4/5]"] as const;

export function FeaturedWorkGrid({ items }: { items: GalleryItem[] }) {
  const { activeItem, open, close, prev, next, restoreFocus, setTriggerRef } =
    useLightboxGallery(items);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[5fr_4fr_3fr] gap-5 items-start">
        {items.slice(0, 3).map((item, i) => (
          <div key={item.slug} className={i === 1 ? "md:mt-20" : ""}>
            {/* Card — clickable */}
            <button
              ref={setTriggerRef(i)}
              onClick={() => open(i)}
              aria-label={`No. ${String(i + 1).padStart(2, "0")}, view ${item.client ?? item.title}`}
              className="group relative w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div
                className={`relative overflow-hidden bg-ink-3 border border-foreground/15 ${aspectClasses[i]}`}
              >
                {/* Photo */}
                {item.image && (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover z-0 transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                  />
                )}

                <StripeOverlay opacity={0.15} className="z-10" />

                {/* NO. badge */}
                <div className="absolute top-3 left-3 z-20 bg-ink border border-foreground/25 px-2 py-0.5">
                  <span className="font-mono text-3xs uppercase tracking-widest text-inverse">
                    No.&nbsp;{String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Placeholder — only when no image */}
                {!item.image && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
                    <RegistrationMark className="w-8 h-8 text-paper/20" />
                    <span className="font-mono text-3xs uppercase tracking-widest text-lightbox-text-dim">
                      Garment Photo
                    </span>
                  </div>
                )}

                {/* Hover scrim */}
                <div className="absolute inset-0 z-20 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-300 motion-reduce:transition-none" />
              </div>
            </button>

            {/* Metadata */}
            <div className="mt-4 flex justify-between items-start gap-4">
              <p className="font-display uppercase font-black text-text-primary text-[clamp(1.5rem,2vw,2.5rem)] leading-none">
                {item.client}
              </p>
              <div className="text-right shrink-0">
                <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary leading-relaxed">
                  {item.year}
                </p>
                <p className="font-mono text-xs uppercase tracking-widest text-text-accent">
                  {item.colors} Color{item.colors !== 1 ? "s" : ""}
                </p>
                {item.category && (
                  <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
                    {item.category}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeItem &&
        createPortal(
          <Lightbox
            item={activeItem}
            items={items}
            categoryLabel="Garment"
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
