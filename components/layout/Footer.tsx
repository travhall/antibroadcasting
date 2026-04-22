import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="px-6 py-12 bg-bg-base sticky bottom-0 z-0">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <p className="font-bold text-lg text-text-primary">
            {siteConfig.company.legalName}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            {siteConfig.contact.address.full}
          </p>
          <a
            href={siteConfig.contact.phoneHref}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            {siteConfig.contact.phone}
          </a>
        </div>
        <div className="flex gap-6 text-sm text-text-secondary">
          {Object.entries(siteConfig.social).map(([key, social]) => (
            <a
              key={key}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-primary transition-colors"
            >
              {social.name}
            </a>
          ))}
        </div>
      </div>
      <p className="md:text-center text-xs text-pretty text-text-muted mt-8">
        &copy; {new Date().getFullYear()} {siteConfig.company.name}. All rights
        reserved.
      </p>
    </footer>
  );
}
