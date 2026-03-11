import type { Metadata } from "next";
import { QuoteForm } from "@/components/ui/QuoteForm";

export const metadata: Metadata = {
  title: "Get a Quote",
  description:
    "Ready to print? Tell us about your project and we'll get back to you within 1–2 business days.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-bg-base pt-32 pb-24 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Get a Quote</h1>
        <p className="text-zinc-500 mb-10">
          Fill out the form below and we'll get back to you within 1–2 business
          days. The more detail you give us, the faster we can turn around an
          accurate quote.
        </p>

        <QuoteForm />

        <div className="mt-12 pt-8 border-t border-zinc-200 text-sm text-zinc-500 space-y-1">
          <p>Prefer to call or email directly?</p>
          <p>
            <a
              href="tel:6128369488"
              className="font-medium text-zinc-900 hover:underline"
            >
              612.836.9488
            </a>
          </p>
          <p>
            <a
              href="mailto:info@antibroadcasting.com"
              className="font-medium text-zinc-900 hover:underline"
            >
              info@antibroadcasting.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
