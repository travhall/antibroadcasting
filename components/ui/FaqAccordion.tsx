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
      {/* Screen-reader status: announces filter result count on category change */}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {activeCategory === "all"
          ? `Showing all ${filtered.length} questions`
          : `Showing ${filtered.length} question${filtered.length !== 1 ? "s" : ""} in ${CATEGORY_LABELS[activeCategory] ?? activeCategory}`}
      </span>

      {/* Category filter — matches portfolio chip style */}
      <div
        role="group"
        aria-label="Filter by category"
        className="flex flex-wrap gap-2 mb-10"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setOpen(null);
            }}
            aria-pressed={activeCategory === cat}
            className={`min-h-11 px-4 py-1.5 font-mono text-xs uppercase tracking-widest border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${activeCategory === cat
              ? "bg-gold text-ink border-gold"
              : "bg-transparent text-text-secondary border-foreground/20 hover:border-gold hover:text-text-accent"
              }`}
          >
            {cat === "all" ? "All" : (CATEGORY_LABELS[cat] ?? cat)}
          </button>
        ))}
      </div>

      {/* Accordion items */}
      <div className="divide-y divide-foreground/10 border-y border-foreground/10">
        {filtered.map((item) => {
          const isOpen = open === item.slug;
          return (
            <div key={item.slug}>
              <button
                id={`faq-question-${item.slug}`}
                onClick={() => setOpen(isOpen ? null : item.slug)}
                className="flex w-full items-center justify-between py-5 text-left gap-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.slug}`}
              >
                <span className="text-base font-medium text-text-primary">
                  {item.question}
                </span>
                {/* + / − indicator — aria-hidden, state conveyed by aria-expanded */}
                <span
                  aria-hidden="true"
                  className={`shrink-0 font-mono text-base leading-none select-none transition-colors ${isOpen ? "text-text-accent" : "text-text-muted"
                    }`}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              <div
                id={`faq-answer-${item.slug}`}
                role="region"
                aria-labelledby={`faq-question-${item.slug}`}
                hidden={!isOpen}
                className="pb-6 pr-8 text-sm text-text-secondary leading-relaxed max-w-2xl"
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
