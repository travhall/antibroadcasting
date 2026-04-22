import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: `Artist-run screen printing out of ${siteConfig.contact.location}. Learn who we are and how we work.`,
};

export default function AboutPage() {
  return (
    <section className="w-full max-w-400 mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">About</h1>
    </section>
  );
}
