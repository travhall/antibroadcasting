"use client";

import { useState, useEffect } from "react";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";

const nav = siteConfig.navigation;

function NavLink({
  href,
  children,
  onClick,
}: LinkProps & { children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`transition-colors ${
        active
          ? "text-text-primary font-semibold"
          : "text-text-muted hover:text-text-primary"
      }`}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  // Prevent scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-bg-base border-b border-border-default">
        <Link
          href="/"
          className="font-black font-display text-2xl tracking-wider text-text-primary uppercase hover:opacity-50 transition-opacity duration-300 max-w-[13ch] leading-5"
        >
          {siteConfig.company.nickname}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {nav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span
            className={`block h-0.5 w-full bg-foreground transition-transform origin-center ${
              open ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-foreground transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-foreground transition-transform origin-center ${
              open ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <nav
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-bg-base shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <span className="font-bold tracking-tight text-text-primary">
            Menu
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-1 p-6">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              <span className="block py-3 text-lg border-b border-border-subtle">
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>
        <div className="absolute bottom-8 px-6 text-sm text-text-muted space-y-1">
          <p>
            <a
              href={siteConfig.contact.phoneHref}
              className="hover:text-text-primary transition-colors"
            >
              {siteConfig.contact.phone}
            </a>
          </p>
          <p>{siteConfig.contact.location}</p>
        </div>
      </nav>
    </>
  );
}
