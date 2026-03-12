import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About",
  description: `Artist-run screen printing out of ${siteConfig.contact.location}. Learn who we are and how we work.`,
};

export default function AboutPage() {
  return (
    <main>
      <h1>About</h1>
    </main>
  );
}
