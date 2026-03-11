import type { Metadata } from "next";
import { reader } from "@/lib/keystatic";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Everything you need to know before placing an order — art requirements, minimums, turnaround, proofing, and the full quote process.",
};

export default async function HowItWorksPage() {
  const faqEntries = await reader.collections.faq.all();

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

  return (
    <main className="min-h-screen bg-bg-base pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">
          How It Works
        </h1>
        <p className="text-text-secondary mb-12">
          Everything you need to know before placing an order — from art
          requirements to payment. Still have questions?{" "}
          <a
            href="/contact"
            className="underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            Just ask.
          </a>
        </p>

        {/* Process steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
          {[
            {
              step: "01",
              title: "Submit a Quote",
              body: "Tell us about your project — quantity, colors, garment, and timeline. We'll get back to you within 1–2 business days.",
            },
            {
              step: "02",
              title: "Approve the Proof",
              body: "We create a digital mock-up of your design. No printing starts until you give the green light.",
            },
            {
              step: "03",
              title: "Pick Up Your Order",
              body: "Standard turnaround is 7–10 business days from when we receive your blanks.",
            },
          ].map((s) => (
            <div key={s.step}>
              <span className="text-xs font-mono text-text-muted tracking-widest">
                {s.step}
              </span>
              <h2 className="mt-1 text-lg font-semibold text-text-primary mb-2">
                {s.title}
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="text-xl font-bold text-text-primary mb-6">
          Frequently Asked Questions
        </h2>
        <FaqAccordion items={items} />
      </div>
    </main>
  );
}
