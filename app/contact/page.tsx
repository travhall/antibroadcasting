import type { Metadata } from "next";
import { QuoteForm } from "@/components/ui/QuoteForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Get a Quote",
  description: siteConfig.forms.quote.responseTime
    ? `Ready to print? Tell us about your project and we'll get back to you within ${siteConfig.forms.quote.responseTime}.`
    : "Ready to print? Tell us about your project and we'll get back to you within 1–2 business days.",
};

export default function ContactPage() {
  return (
    <section className="w-full max-w-400 mx-auto">
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
              href={siteConfig.contact.phoneHref}
              className="font-medium text-zinc-900 hover:underline"
            >
              {siteConfig.contact.phone}
            </a>
          </p>
          <p>
            <a
              href={siteConfig.contact.emailHref}
              className="font-medium text-zinc-900 hover:underline"
            >
              {siteConfig.contact.email}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
