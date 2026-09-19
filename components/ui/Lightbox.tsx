"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { RegistrationMark } from "./RegistrationMark";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import type { GalleryItem } from "./GalleryGrid";

export function Lightbox({
  item,
  items,
  categoryLabel = "Category",
  onClose,
  onPrev,
  onNext,
  onRestoreFocus,
}: {
  item: GalleryItem;
  items: GalleryItem[];
  categoryLabel?: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestoreFocus: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const currentIndex = items.findIndex((i) => i.slug === item.slug);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;
  const dialogRef = useRef<HTMLDialogElement>(null);

  const projectImages = [item.image, ...item.images].filter(
    (src): src is string => Boolean(src),
  );
  const [prevSlug, setPrevSlug] = useState(item.slug);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  if (prevSlug !== item.slug) {
    setPrevSlug(item.slug);
    setActiveImageIndex(0);
  }
  const activeImage = projectImages[activeImageIndex] ?? null;

  useEffect(() => {
    dialogRef.current?.showModal();
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    onRestoreFocus();
    setIsVisible(false);
    setTimeout(() => {
      dialogRef.current?.close();
      onClose();
    }, 200);
  }, [onClose, onRestoreFocus]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key === "ArrowLeft" && hasPrev) {
        onPrev();
        return;
      }
      if (e.key === "ArrowRight" && hasNext) {
        onNext();
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, onPrev, onNext, hasPrev, hasNext]);

  useBodyScrollLock(true);

  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) handleClose();
    },
    [handleClose],
  );

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      aria-label={`${item.client ?? item.title} — lightbox`}
      className={`lightbox z-200 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Corner registration marks */}
      <RegistrationMark className="absolute top-7 left-7 w-5 h-5 text-paper/40 pointer-events-none" />
      <RegistrationMark className="absolute top-7 right-7 w-5 h-5 text-gold/70 pointer-events-none" />
      <RegistrationMark className="absolute bottom-7 left-7 w-5 h-5 text-paper/40 pointer-events-none" />
      <RegistrationMark className="absolute bottom-7 right-7 w-5 h-5 text-paper/40 pointer-events-none" />

      {/* Close — autofocus so keyboard users land here on open */}
      <button
        autoFocus
        onClick={handleClose}
        aria-label="Close lightbox"
        className="absolute top-8 right-8 z-10 w-14 h-14 rounded-full bg-ink-2 border border-paper/10 text-paper flex items-center justify-center hover:bg-gold hover:text-ink hover:border-gold transition-colors focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Content */}
      <div
        className={`relative grid grid-cols-1 md:grid-cols-[50vw_1fr] gap-10 max-w-325 w-full max-h-[calc(100vh-80px)] overflow-y-scroll transition-transform duration-200 ease-out motion-reduce:transition-none ${
          isVisible ? "scale-100" : "scale-[0.98]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative aspect-square bg-ink-2 border border-paper/10 overflow-hidden">
          {activeImage ? (
            <Image
              src={activeImage}
              alt={item.imageAlt || `${item.client ?? item.title} screen print`}
              fill
              sizes="(min-width: 768px) 60vw, 90vw"
              className="object-contain"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-lightbox-text-dim text-sm">
              No image
            </div>
          )}
        </div>

        {/* Meta panel */}
        <div className="flex flex-col text-paper py-2">
          {item.category && (
            <span className="self-start font-mono text-3xs uppercase tracking-mega font-bold px-2.5 py-1 bg-gold text-ink mb-4">
              {item.category.replace(/-/g, " ")}
            </span>
          )}

          <h2 className="font-display font-black uppercase text-[44px] leading-[0.95] tracking-[-0.01em] m-0 mb-3">
            {item.client ?? item.title}
          </h2>

          {item.client && (
            <p className="font-mono text-2xs uppercase tracking-mega text-lightbox-text-dim mb-6">
              {item.title}
            </p>
          )}

          {item.description && (
            <p className="text-base leading-relaxed text-paper/70 mb-7">
              {item.description}
            </p>
          )}

          {projectImages.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-7">
              {projectImages.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImageIndex(i)}
                  aria-label={`View image ${i + 1} of ${projectImages.length}`}
                  aria-current={i === activeImageIndex}
                  className={`relative w-16 h-16 overflow-hidden border transition-colors ${
                    i === activeImageIndex
                      ? "border-gold"
                      : "border-paper/15 hover:border-paper/40"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="mt-auto border-t border-paper/10 pt-5 grid grid-cols-2 gap-x-5 gap-y-3.5">
            {item.year && (
              <div className="flex flex-col gap-1">
                <span className="font-mono text-3xs uppercase tracking-mega text-lightbox-text-dim">
                  Year
                </span>
                <span className="font-display font-black uppercase text-[22px] leading-none">
                  {item.year}
                </span>
              </div>
            )}
            {item.colors && (
              <div className="flex flex-col gap-1">
                <span className="font-mono text-3xs uppercase tracking-mega text-lightbox-text-dim">
                  Colors
                </span>
                <span className="font-display font-black uppercase text-[22px] leading-none text-gold">
                  {item.colors}
                </span>
              </div>
            )}
            {item.category && (
              <div className="flex flex-col gap-1 col-span-2">
                <span className="font-mono text-3xs uppercase tracking-mega text-lightbox-text-dim">
                  {categoryLabel}
                </span>
                <span className="font-display font-black uppercase text-[22px] leading-none">
                  {item.category.replace(/-/g, " ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination pill */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center bg-ink-2 border border-paper/10 rounded-full overflow-hidden whitespace-nowrap">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          disabled={!hasPrev}
          aria-label="Previous image"
          className="flex items-center justify-center w-11 h-11 text-paper hover:text-gold transition-colors disabled:opacity-25 disabled:pointer-events-none"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <span className="font-mono text-2xs uppercase tracking-mega text-paper/60 px-1 select-none">
          <span className="text-paper font-semibold">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <span className="mx-2">/</span>
          <span>{String(items.length).padStart(2, "0")}</span>
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          disabled={!hasNext}
          aria-label="Next image"
          className="flex items-center justify-center w-11 h-11 text-paper hover:text-gold transition-colors disabled:opacity-25 disabled:pointer-events-none"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </dialog>
  );
}
