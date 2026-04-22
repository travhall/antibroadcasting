import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <section className="flex flex-1 items-center justify-center">
      <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-display font-black text-text-primary uppercase text-balance">
        {siteConfig.company.name}
      </h1>
    </section>
  );
}
