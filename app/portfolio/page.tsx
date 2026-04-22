import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Browse our screen printing work — bands, artists, and events across Minneapolis and beyond.",
};

export default function PortfolioPage() {
  return (
    <section className="w-full max-w-400 mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Portfolio</h1>
    </section>
  );
}
