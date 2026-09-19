import type { Metadata } from "next";
import { getSiteInfo } from "@/lib/get-site-info";
import { siteConfig } from "@/lib/site-config";
import { QuoteForm } from "@/components/ui/QuoteForm";
import { RegistrationMark } from "@/components/ui/RegistrationMark";
import { IndexLabel } from "@/components/ui/IndexLabel";
import { PulseDot } from "@/components/ui/PulseDot";
import { PageBreadcrumb } from "@/components/ui/PageBreadcrumb";
import { InstagramIcon, FacebookIcon, XIcon } from "@/components/ui/Icons";

export async function generateMetadata(): Promise<Metadata> {
  const siteInfo = await getSiteInfo();
  const description = `Ready to print? Tell us about your project and we'll get back to you within ${siteInfo.forms.quote.responseTime}.`;
  return {
    title: "Contact",
    description,
    alternates: { canonical: `${siteConfig.site.url}/contact` },
    openGraph: {
      title: "Contact | Antibroadcasting Inc.",
      description,
      url: `${siteConfig.site.url}/contact`,
    },
  };
}

export default async function ContactPage() {
  const siteInfo = await getSiteInfo();
  const { contact, company, social, forms } = siteInfo;

  return (
    <div className="w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-10">
        <PageBreadcrumb page="Contact" />

        <h1 className="font-display font-black uppercase leading-[0.85] text-[clamp(5rem,18vw,12rem)]">
          Get in Touch<span className="text-gold">.</span>
        </h1>

        {/* Response time note */}
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <PulseDot />
            <span className="font-mono text-sm uppercase tracking-widest text-text-tertiary text-pretty">
              We respond within {forms.quote.responseTime}
            </span>
          </div>
          <span className="h-px flex-1 bg-foreground/10 hidden sm:block" />
          <RegistrationMark className="w-5 h-5 text-foreground/20 hidden lg:block" />
        </div>
      </section>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <div className="py-20 lg:py-28 flex flex-col lg:flex-row gap-16 xl:gap-24 items-start">
        {/* ── Form — left, dominant ──────────────────────────────────── */}
        <div className="flex-2 min-w-0">
          <IndexLabel className="mb-10">01 / Quote Request</IndexLabel>

          <h2 className="font-display font-black uppercase text-[clamp(2.5rem,6vw,4rem)] leading-[0.9] text-text-primary mb-3">
            Ready to Print<span className="text-gold">?</span>
          </h2>
          <p className="text-text-secondary leading-relaxed max-w-[60ch] mb-10">
            Tell us about your project and we&apos;ll get back to you within{" "}
            {forms.quote.responseTime}. The more detail you give us, the faster
            we can turn around an accurate quote.
          </p>

          <QuoteForm
            garmentOptions={forms.quote.garmentOptions}
            timelineOptions={forms.quote.timelineOptions}
            minimumOrder={siteInfo.business.minimumOrder}
            maxColors={siteInfo.business.maxColors}
            responseTime={forms.quote.responseTime}
            email={contact.email}
            emailHref={`mailto:${contact.email}`}
          />
        </div>

        {/* ── Info sidebar — right ───────────────────────────────────── */}
        <aside className="flex-1 flex flex-col gap-10 lg:sticky lg:top-8">
          <IndexLabel>02 / Find Us</IndexLabel>

          {/* Company name */}
          <div>
            <p className="font-display font-black uppercase text-2xl leading-tight text-text-primary mb-5">
              {company.name}
            </p>

            {/* Address */}
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(contact.address.full)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${contact.address.full} in Google Maps (opens in new tab)`}
              className="tap-target flex flex-col gap-1 mb-6 self-start font-mono text-xs uppercase tracking-widest text-text-tertiary hover:text-text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span>{contact.address.street}</span>
              <span>
                {contact.address.city}, {contact.address.state}{" "}
                {contact.address.zip}
              </span>
            </a>

            {/* Contact links */}
            <div className="flex flex-col gap-2 mb-6">
              <a
                href={contact.phoneHref}
                className="tap-target font-mono text-xs uppercase tracking-widest text-text-accent hover:text-text-primary transition-colors self-start"
              >
                {contact.phone}
              </a>
              <a
                href={`mailto:${contact.email}`}
                className="tap-target font-mono text-xs uppercase tracking-widest text-text-accent hover:text-text-primary transition-colors self-start"
              >
                {contact.email}
              </a>
            </div>

            {/* Hours */}
            <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
              By Appointment Only
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-foreground/10" />

          {/* Social */}
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary mb-4">
              Follow Along
            </p>
            <div className="flex items-center gap-5">
              <a
                href={social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram (opens in new tab)"
                className="font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-text-accent transition-colors flex items-center gap-2"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>Instagram</span>
              </a>
              <a
                href={social.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook (opens in new tab)"
                className="font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-text-accent transition-colors flex items-center gap-2"
              >
                <FacebookIcon className="w-4 h-4" />
                <span>Facebook</span>
              </a>
              <a
                href={social.twitter.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter (opens in new tab)"
                className="font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-text-accent transition-colors flex items-center gap-2"
              >
                <XIcon className="w-4 h-4" />
                <span>X / Twitter</span>
              </a>
            </div>
          </div>

          {/* Registration mark */}
          <RegistrationMark className="w-8 h-8 text-foreground/10 mt-4 hidden lg:block" />
        </aside>
      </div>
    </div>
  );
}
