"use client";

import { useState } from "react";

type FaqItem = {
  slug: string;
  question: string;
  answer: string;
  category: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  pricing: "Pricing",
  ordering: "Ordering",
  art: "Art & Files",
  turnaround: "Turnaround",
  products: "Products & Inks",
  payment: "Payment",
};

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    "all",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  return (
    <div>
      {/* Category filter */}
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap gap-2 mb-8"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setOpen(null);
            }}
            aria-pressed={activeCategory === cat}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              activeCategory === cat
                ? "bg-bg-inverse text-text-inverse border-bg-inverse"
                : "bg-bg-elevated text-text-secondary border-border-default hover:border-border-strong"
            }`}
          >
            {cat === "all" ? "All" : (CATEGORY_LABELS[cat] ?? cat)}
          </button>
        ))}
      </div>

      {/* Accordion items */}
      <div className="divide-y divide-border-default border-y border-border-default">
        {filtered.map((item) => {
          const isOpen = open === item.slug;
          return (
            <div key={item.slug}>
              <button
                id={`faq-question-${item.slug}`}
                onClick={() => setOpen(isOpen ? null : item.slug)}
                className="flex w-full items-center justify-between py-5 text-left gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.slug}`}
              >
                <span className="font-medium text-text-primary">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={`shrink-0 text-text-muted text-lg transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                id={`faq-answer-${item.slug}`}
                role="region"
                aria-labelledby={`faq-question-${item.slug}`}
                hidden={!isOpen}
                className="pb-5 text-sm text-text-secondary leading-relaxed max-w-2xl"
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
