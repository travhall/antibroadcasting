import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <main>
      <section className="flex min-h-screen items-center justify-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-black text-text-primary uppercase text-balance">
          {siteConfig.company.name}
        </h1>
      </section>
    </main>
  );
}
