export const siteConfig = {
  // Company Information
  company: {
    name: "Antibroadcasting Screen Printing",
    nickname: "Antibroadcasting Incorporated",
    legalName: "Antibroadcasting, Inc.",
    description:
      "Artist-run screen printing shop in Minneapolis. Quality prints for bands, artists, and events. 50pc minimums, 7–10 day turnaround.",
    tagline: "Custom Screen Printing. Quality Prints Daily",
    foundedYear: 2024, // Placeholder - update with actual year
  },

  // Contact Information
  contact: {
    phone: "612.836.9488",
    phoneFormatted: "612-836-9488",
    phoneHref: "tel:6128369488",
    email: "info@antibroadcasting.com",
    emailHref: "mailto:info@antibroadcasting.com",
    address: {
      street: "3715 Oregon Ave S #5",
      city: "Minneapolis",
      state: "MN",
      zip: "55426",
      full: "3715 Oregon Ave S #5, Minneapolis, MN 55426",
    },
    location: "Minneapolis, MN",
  },

  // Business Details
  business: {
    minimumOrder: 50,
    turnaroundDays: "7–10",
    turnaroundDaysFormatted: "7–10 business days",
    maxColors: 8,
    serviceArea: "Minneapolis and beyond", // Placeholder - can be updated
    specialties: [
      "Band Merch",
      "Local Artist Prints",
      "Event Merchandise",
      "Business Apparel",
    ],
  },

  // Social Media
  social: {
    instagram: {
      url: "https://www.instagram.com/antibroadcasting_inc/",
      handle: "@antibroadcasting_inc",
      name: "Instagram",
    },
    facebook: {
      url: "https://www.facebook.com/antibroadcasting",
      handle: "@antibroadcasting",
      name: "Facebook",
    },
    twitter: {
      url: "https://x.com/mplsprinting",
      handle: "@mplsprinting",
      name: "Twitter",
    },
  },

  // Website Configuration
  site: {
    url: "https://antibroadcasting.com",
    baseUrl: "https://antibroadcasting.com",
    domain: "antibroadcasting.com",
    title: {
      default: "Antibroadcasting Inc. — Minneapolis Screen Printing",
      template: "%s | Antibroadcasting Inc.",
    },
    description:
      "Artist-run screen printing shop in Minneapolis. Quality prints for bands, artists, and events. 50pc minimums, 7–10 day turnaround.",
    language: "en",
    locale: "en_US",
  },

  // SEO & Metadata
  seo: {
    keywords: [
      "screen printing",
      "minneapolis screen printing",
      "custom t-shirts",
      "band merch",
      "artist prints",
      "event merchandise",
      "custom apparel",
      "minnesota screen printing",
      "antibroadcasting",
    ],
    author: "Antibroadcasting Inc.",
    robots: "index, follow",
    googleVerification: "", // Add Google Site Verification code if needed
    bingVerification: "", // Add Bing Site Verification code if needed
  },

  // Open Graph / Social Sharing
  openGraph: {
    type: "website",
    siteName: "Antibroadcasting Inc.",
    title: "Antibroadcasting Inc. — Minneapolis Screen Printing",
    description:
      "Artist-run screen printing shop in Minneapolis. Quality prints for bands, artists, and events. 50pc minimums, 7–10 day turnaround.",
    url: "https://antibroadcasting.com",
    images: [
      {
        url: "/og-image.jpg", // Placeholder - add actual OG image
        width: 1200,
        height: 630,
        alt: "Antibroadcasting Inc. Screen Printing",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@antibroadcasting_inc", // Update with actual Twitter handle
    creator: "@antibroadcasting_inc", // Update with actual Twitter handle
  },

  // Navigation
  navigation: [
    { label: "Portfolio", href: "/portfolio" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
    { label: "Get a Quote", href: "/contact" },
  ],

  // Form Configuration
  forms: {
    quote: {
      garmentOptions: [
        "T-Shirt",
        "Long Sleeve",
        "Hoodie / Sweatshirt",
        "Tank Top",
        "Tote Bag",
        "Other / Not Sure",
      ],
      timelineOptions: [
        "Standard (7–10 business days)",
        "2–3 weeks",
        "1 month+",
        "Rush — I need it ASAP",
      ],
      recipientEmail: "info@antibroadcasting.com",
      responseTime: "1–2 business days",
    },
  },

  // Content Categories
  categories: {
    gallery: [
      { label: "Band Merch", value: "band-merch" },
      { label: "Local Artist", value: "local-artist" },
      { label: "Event", value: "event" },
      { label: "Business", value: "business" },
    ],
    faq: [
      { label: "Pricing", value: "pricing" },
      { label: "Ordering", value: "ordering" },
      { label: "Art & Files", value: "art" },
      { label: "Turnaround", value: "turnaround" },
      { label: "Products & Inks", value: "products" },
      { label: "Payment", value: "payment" },
    ],
  },

  // Typography
  fonts: {
    primary: "Geist Sans",
    mono: "Geist Mono",
    display: "Dominique",
  },

  // Analytics (placeholders for when needed)
  analytics: {
    googleAnalyticsId: "", // Add GA4 ID when ready
    googleTagManagerId: "", // Add GTM ID when ready
    facebookPixelId: "", // Add Facebook Pixel ID when ready
  },

  // Legal
  legal: {
    privacyPolicyUrl: "/privacy", // Placeholder - create when needed
    termsOfServiceUrl: "/terms", // Placeholder - create when needed
  },
} as const;

// Type exports for TypeScript usage
export type SiteConfig = typeof siteConfig;
export type CompanyInfo = typeof siteConfig.company;
export type ContactInfo = typeof siteConfig.contact;
export type SocialLinks = typeof siteConfig.social;
export type NavigationItem = (typeof siteConfig.navigation)[0];
