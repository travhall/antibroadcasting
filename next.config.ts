import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      // Instagram CDN — for when we pull in IG images
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.instagram.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      // Redirect old WordPress URLs to new structure
      { source: "/faq", destination: "/how-it-works", permanent: true },
      { source: "/faq/", destination: "/how-it-works", permanent: true },
      { source: "/art-requirements", destination: "/how-it-works", permanent: true },
      { source: "/art-requirements/", destination: "/how-it-works", permanent: true },
      { source: "/promos", destination: "/how-it-works", permanent: true },
      { source: "/promos/", destination: "/how-it-works", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/about-us/", destination: "/about", permanent: true },
      { source: "/portfolio/", destination: "/portfolio", permanent: true },
    ];
  },
};

export default nextConfig;
