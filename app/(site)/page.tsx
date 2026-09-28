import type { Metadata } from "next";
import Image from "next/image";
import { getSiteInfo, type SiteInfo } from "@/lib/get-site-info";
import { siteConfig } from "@/lib/site-config";
import { buttonVariants } from "@/components/ui/Button";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { RegistrationMark } from "@/components/ui/RegistrationMark";
import { CornerBrackets } from "@/components/ui/CornerBrackets";
import { StripeOverlay } from "@/components/ui/StripeOverlay";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { IndexLabel } from "@/components/ui/IndexLabel";
import { Stat } from "@/components/ui/Stat";
import { PulseDot } from "@/components/ui/PulseDot";
import { FeaturedWorkGrid } from "@/components/ui/FeaturedWorkGrid";
import { CtaBand } from "@/components/ui/CtaBand";
import { PromoBanner } from "@/components/ui/PromoBanner";
import { getActivePromo } from "@/lib/get-active-promo";
import { getGallery } from "@/lib/get-gallery";

export async function generateMetadata(): Promise<Metadata> {
  const siteInfo = await getSiteInfo();
  return {
    title: siteInfo.seo.title,
    description: siteInfo.seo.description,
    alternates: { canonical: siteConfig.site.url },
    openGraph: {
      title: siteInfo.seo.title,
      description: siteInfo.seo.description,
      url: siteConfig.site.url,
    },
  };
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function Hero({ siteInfo }: { siteInfo: SiteInfo }) {
  return (
    <section className="relative flex flex-col min-h-screen">
      {/* Meta row — eyebrow + booking badge */}
      <div className="flex flex-col gap-4 md:flex-row items-start md:items-center justify-between pt-10 pb-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
            Est. 2005 {siteInfo.contact.address.city}{" "}
            {siteInfo.contact.address.state} · Artist-Run
          </span>
          <span className="hidden sm:block h-px w-16 bg-gold" />
        </div>
        {siteInfo.booking.visible && (
          <TransitionLink
            href="/contact"
            className="flex items-center gap-2 font-mono text-xs lg:text-sm xl:text-base font-black tracking-widest uppercase text-button-primary-text bg-button-primary-surface px-3 py-1 hover:bg-button-primary-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <PulseDot color="bg-bg-base" opacity="opacity-60" />
            Now Booking — {siteInfo.booking.label}
          </TransitionLink>
        )}
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-12 py-12">
        {/* Left — headline, subhead, CTAs */}
        <div className="flex flex-col justify-center flex-3">
          <h1 className="font-display font-black uppercase leading-[0.75]">
            <span className="block text-[clamp(6rem,15vw,12rem)]">Custom</span>
            <span className="block text-[clamp(6rem,15vw,12rem)]">Screen</span>
            <span className="block text-[clamp(6rem,15vw,12rem)]">
              Printing<span className="text-gold">.</span>
            </span>
          </h1>

          <p className="mt-6 text-text-secondary max-w-[40ch] lg:max-w-[60ch] text-pretty leading-relaxed">
            {siteInfo.company.nickname} is an artist-run shop in Minneapolis. We
            print for bands, artists, events, and our community.{" "}
            {siteInfo.company.tagline}
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <TransitionLink
              href="/contact"
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              Get a Quote
            </TransitionLink>
            <TransitionLink
              href="/portfolio"
              className={buttonVariants({ variant: "outline", size: "md" })}
            >
              See Our Work
            </TransitionLink>
          </div>
        </div>

        {/* Right — hero photograph with editorial overlay (decorative) */}
        <div
          className="hidden lg:flex flex-2 self-stretch relative"
          aria-hidden="true"
        >
          <div className="relative w-full h-full min-h-120 overflow-hidden border border-paper/10">
            <Image
              src="/images/hero-img01.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw"
              className="object-cover"
              priority
            />
            <StripeOverlay opacity={0.08} />

            {/* Dark scrim for legibility */}
            <div className="absolute inset-0 bg-ink/30" />

            {/* Corner brackets */}
            <CornerBrackets />

            {/* Catalog label — top */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2">
              <span className="font-mono text-3xs uppercase tracking-widest text-paper/60">
                01 / Catalog No. 2026-A
              </span>
            </div>

            {/* Center registration mark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <RegistrationMark className="w-12 h-12 text-paper/25" />
            </div>

            {/* Press label — center-left */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
              <span className="font-mono text-3xs uppercase tracking-widest text-paper/50">
                Press Photograph
              </span>
            </div>

            {/* File label — bottom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <span className="font-mono text-3xs uppercase tracking-widest text-paper/60">
                File · Hero_01.tif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip — mt-auto pins to bottom of flex column */}
      <div className="mt-auto pt-8 border-t border-foreground/10 flex flex-wrap items-end justify-between gap-y-8 gap-x-12 pb-8">
        {/* Stats */}
        <div className="flex flex-wrap gap-x-16 gap-y-6">
          {[
            {
              value: `${siteInfo.business.minimumOrder}+`,
              label: "Piece Minimum",
            },
            {
              value: `${siteInfo.business.turnaroundDays}`,
              label: "Day Turnaround",
            },
            { value: `${siteInfo.business.maxColors}`, label: "Color Maximum" },
          ].map((stat) => (
            <Stat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>

        {/* Right — address + status */}
        <div className="flex flex-col self-end gap-2 text-left lg:text-right">
          <p className="font-mono text-xs uppercase tracking-widest text-text-secondary leading-relaxed">
            {siteInfo.contact.address.street}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-text-secondary -mt-1">
            {siteInfo.contact.address.city}, {siteInfo.contact.address.state}{" "}
            {siteInfo.contact.address.zip}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-text-accent">
            By Appointment Only
          </p>
          <div className="flex items-center gap-2 mt-1">
            <PulseDot />
            <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
              Press Running · Bay 02
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessStrip() {
  const steps = [
    {
      n: "01",
      title: "Submit a Quote",
      body: "Tell us your quantity, colors, garment, and timeline. We'll write back within a day with pricing and a press date.",
    },
    {
      n: "02",
      title: "Approve the Proof",
      body: "We build a digital mock-up of your design on your chosen garment. Nothing goes to press until you're satisfied.",
    },
    {
      n: "03",
      title: "Pick Up Your Order",
      body: "Standard turnaround is 7–10 business days from when we receive your blanks. Local pickup or ship anywhere in the U.S.",
    },
  ];

  return (
    <section
      className="bg-bg-inverse -mx-4 md:-mx-6 lg:-mx-8 xl:-mx-12"
      data-inverse
    >
      <div className="w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto px-4 md:px-6 lg:px-8 xl:px-12 pt-20 pb-32">
        <SectionLabel
          className="mb-16"
          lineColor="bg-text-inverse/30"
          textColor="text-text-tertiary"
        >
          Index 02 — How It Works
        </SectionLabel>

        {/* Heading row */}
        <div className="mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <h2 className="font-display font-black uppercase leading-[0.85] text-[clamp(4rem,10vw,8rem)] text-text-inverse">
            Our
            <br />
            Process<span className="text-gold">.</span>
          </h2>
          <div className="flex flex-col items-start lg:items-end gap-3 lg:pb-2 shrink-0">
            <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
              Three Steps, Start to Finish
            </p>
            <TransitionLink
              href="/how-it-works"
              className={buttonVariants({ variant: "neutral", size: "md" })}
            >
              See How It Works →
            </TransitionLink>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-text-inverse/15 mb-0" />

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-text-inverse/15">
          {steps.map((step) => (
            <div
              key={step.n}
              className="pt-8 pb-12 px-0 md:px-8 first:pl-0 last:pr-0 flex flex-col gap-6"
            >
              <IndexLabel>Step {step.n}</IndexLabel>

              <h3 className="font-display font-black uppercase text-[clamp(2rem,3.5vw,3.5rem)] leading-[0.9] text-text-inverse">
                {step.title}
                <span className="text-gold">.</span>
              </h3>
              <p className="text-text-on-inverse-muted text-sm leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function Home() {
  const [gallery, siteInfo, activePromo] = await Promise.all([
    getGallery(),
    getSiteInfo(),
    getActivePromo(),
  ]);
  const featuredWork = gallery.filter((item) => item.featured);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteInfo.company.legalName,
    url: siteConfig.site.url,
    telephone: siteInfo.contact.phone,
    description: siteInfo.seo.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteInfo.contact.address.street,
      addressLocality: siteInfo.contact.address.city,
      addressRegion: siteInfo.contact.address.state,
      postalCode: siteInfo.contact.address.zip,
      addressCountry: "US",
    },
    sameAs: [
      siteInfo.social.instagram.url,
      siteInfo.social.facebook.url,
      siteInfo.social.twitter.url,
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Constrained wrapper — Hero + Featured Work only */}
      <div className="w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto">
        <Hero siteInfo={siteInfo} />

        {activePromo && <PromoBanner promo={activePromo} />}

        {/* Featured Work */}
        {featuredWork.length > 0 && (
          <section className="pt-20 pb-16 border-t border-foreground/10">
            <SectionLabel>Index 01 — Recent Work</SectionLabel>

            {/* Heading row */}
            <div className="mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <h2 className="font-display font-black uppercase leading-[0.85] text-[clamp(4rem,10vw,8rem)]">
                Featured
                <br />
                Work<span className="text-gold">.</span>
              </h2>
              <div className="flex flex-col items-start lg:items-end gap-3 lg:pb-2 shrink-0">
                <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
                  Pulled From the Archive
                </p>
                <TransitionLink
                  href="/portfolio"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  View All Portfolio →
                </TransitionLink>
              </div>
            </div>

            {/* Cards — asymmetric staggered grid with lightbox */}
            <FeaturedWorkGrid items={featuredWork.slice(0, 3)} />
          </section>
        )}
      </div>

      {/* Full-bleed sections — outside the constrained wrapper so -mx-* only escapes main's padding */}
      <ProcessStrip />
      <CtaBand
        heading={
          <>
            Ready to
            <br />
            Print?
          </>
        }
        description="Send us your file, your idea, or a napkin sketch. We answer every quote request personally — usually within 24 hours."
        primaryCta={{ label: "Get a Quote", href: "/contact" }}
        secondaryCta={{ label: "How It Works", href: "/how-it-works" }}
      />
    </>
  );
}
