import { cache } from "react";
import { reader } from "@/lib/keystatic";

export const getSiteInfo = cache(async () => {
  const raw = await reader.singletons.siteInfo.read();
  if (!raw) throw new Error("siteInfo singleton not found in content/site-info.json");

  return {
    company: {
      name: raw.company.name ?? "",
      legalName: raw.company.legalName ?? "",
      nickname: raw.company.nickname ?? "",
      tagline: raw.company.tagline ?? "",
    },
    contact: {
      phone: raw.contact.phone ?? "",
      phoneHref: raw.contact.phoneHref ?? "",
      email: raw.contact.email ?? "",
      address: {
        street: raw.contact.addressStreet ?? "",
        city: raw.contact.addressCity ?? "",
        state: raw.contact.addressState ?? "",
        zip: raw.contact.addressZip ?? "",
        full: `${raw.contact.addressStreet ?? ""}, ${raw.contact.addressCity ?? ""}, ${raw.contact.addressState ?? ""} ${raw.contact.addressZip ?? ""}`,
        location: `${raw.contact.addressCity ?? ""}, ${raw.contact.addressState ?? ""}`,
      },
    },
    social: {
      instagram: {
        url: raw.social.instagramUrl ?? "",
        handle: raw.social.instagramHandle ?? "",
      },
      facebook: {
        url: raw.social.facebookUrl ?? "",
        handle: raw.social.facebookHandle ?? "",
      },
      twitter: {
        url: raw.social.twitterUrl ?? "",
        handle: raw.social.twitterHandle ?? "",
      },
    },
    booking: {
      visible: raw.booking.visible ?? true,
      label: raw.booking.label ?? "Summer '26",
    },
    business: {
      minimumOrder: raw.business.minimumOrder ?? 50,
      turnaroundDays: raw.business.turnaroundDays ?? "7–10",
      maxColors: raw.business.maxColors ?? 8,
    },
    seo: {
      title: raw.seo.metaTitle ?? "",
      description: raw.seo.metaDescription ?? "",
      keywords: [...(raw.seo.seoKeywords ?? [])],
    },
    forms: {
      quote: {
        responseTime: raw.business.responseTime ?? "1–2 business days",
        emailFrom: raw.quoteForm.emailFrom ?? "Antibroadcasting Quotes <quotes@send.antibroadcasting.com>",
        emailTo: raw.quoteForm.emailTo ?? "info@antibroadcasting.com",
        garmentOptions: [...(raw.quoteForm.garmentOptions ?? [])],
        timelineOptions: [...(raw.quoteForm.timelineOptions ?? [])],
      },
    },
  };
});

export type SiteInfo = Awaited<ReturnType<typeof getSiteInfo>>;
