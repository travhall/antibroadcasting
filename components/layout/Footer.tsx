import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-border-default px-6 py-12 mt-24 bg-bg-base">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <p className="font-bold text-lg text-text-primary">
            {siteConfig.company.name}
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
          <a
            href={siteConfig.social.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            {siteConfig.social.instagram.name}
          </a>
          <a
            href={siteConfig.social.facebook.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            {siteConfig.social.facebook.name}
          </a>
        </div>
      </div>
      <p className="text-center text-xs text-text-muted mt-8">
        &copy; {new Date().getFullYear()} {siteConfig.company.name}. All rights
        reserved.
      </p>
    </footer>
  );
}
