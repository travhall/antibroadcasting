export function Footer() {
  return (
    <footer className="border-t border-border-default px-6 py-12 mt-24 bg-bg-base">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <p className="font-bold text-lg text-text-primary">
            Antibroadcasting Inc.
          </p>
          <p className="text-sm text-text-secondary mt-1">
            3715 Oregon Ave S #5, Minneapolis, MN 55426
          </p>
          <a
            href="tel:6128369488"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            612.836.9488
          </a>
        </div>
        <div className="flex gap-6 text-sm text-text-secondary">
          <a
            href="https://www.instagram.com/antibroadcasting_inc/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            Instagram
          </a>
          <a
            href="https://web.facebook.com/antibroadcasting"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            Facebook
          </a>
        </div>
      </div>
      <p className="text-center text-xs text-text-muted mt-8">
        &copy; {new Date().getFullYear()} Antibroadcasting Inc. All rights
        reserved.
      </p>
    </footer>
  );
}
