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

  const categories = ["all", ...Array.from(new Set(items.map((i) => i.category)))];

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setOpen(null); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCategory === cat
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-500"
            }`}
          >
            {cat === "all" ? "All" : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Accordion items */}
      <div className="divide-y divide-zinc-200 border-y border-zinc-200">
        {filtered.map((item) => {
          const isOpen = open === item.slug;
          return (
            <div key={item.slug}>
              <button
                onClick={() => setOpen(isOpen ? null : item.slug)}
                className="flex w-full items-center justify-between py-5 text-left gap-4"
                aria-expanded={isOpen}
              >
                <span className="font-medium text-zinc-900">{item.question}</span>
                <span
                  className={`flex-shrink-0 text-zinc-400 text-lg transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="pb-5 text-sm text-zinc-600 leading-relaxed max-w-2xl">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
