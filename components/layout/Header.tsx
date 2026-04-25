"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { TransitionLink } from "./TransitionLink";

const nav = siteConfig.navigation;

function NavLink({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <TransitionLink
      href={href}
      onClick={onClick}
      className={`relative hover:text-text-inverse rounded-xs transition-colors self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${active
        ? "font-black pointer-events-none md:before:absolute md:before:inset-0 md:before:-z-10 md:before:scale-y-100 md:before:h-0.5 md:before:bg-(--color-primary-500)"
        : "text-text-muted"
        } ${className || ""}`}
    >
      {children}
    </TransitionLink>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  const logoRef = useRef<HTMLAnchorElement>(null);
  const logoCleanup = useRef<(() => void) | null>(null);

  const handleLogoEnter = useCallback(() => {
    const el = logoRef.current;
    if (!el) return;
    logoCleanup.current?.();
    logoCleanup.current = null;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'logo-hover-in 275ms ease forwards';
  }, []);

  const handleLogoLeave = useCallback(() => {
    const el = logoRef.current;
    if (!el) return;
    logoCleanup.current?.();

    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'logo-hover-out 275ms ease forwards';

    const onEnd = () => {
      el.removeEventListener('animationend', onEnd);
      logoCleanup.current = null;
      el.style.animation = 'none';
      el.style.backgroundPosition = '0 100%';
      requestAnimationFrame(() => {
        el.style.backgroundPosition = '';
        el.style.animation = '';
      });
    };
    el.addEventListener('animationend', onEnd);
    logoCleanup.current = () => el.removeEventListener('animationend', onEnd);
  }, []);

  // Close drawer on route change
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      if (diff > 8 && currentY > 80) {
        setHidden(true);
      } else if (diff < -8) {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-100 focus-visible:rounded-input focus-visible:bg-bg-base focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Skip to main content
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-100 px-6 py-4 flex items-center justify-between bg-bg-base border-b border-border-default transition-transform duration-300 ease-in-out ${hidden ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="w-full md:max-w-400 md:mx-auto inline-block md:flex md:items-center md:justify-between">

          <TransitionLink
            ref={logoRef}
            href="/"
            className="logo font-black font-display text-2xl tracking-wider text-text-primary uppercase leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onMouseEnter={handleLogoEnter}
            onMouseLeave={handleLogoLeave}
          >
            {siteConfig.company.nickname}
          </TransitionLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {nav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className="text-base font-medium px-5 py-4 relative overflow-hidden before:absolute before:inset-0 before:-z-10 before:transform before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top before:bg-(--color-primary-500) transition-all"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span
            className={`block h-0.5 w-full bg-foreground transition-transform origin-center ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-full bg-foreground transition-opacity ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-full bg-foreground transition-transform origin-center ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-bg-inset/80 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <nav
        className={`fixed top-18 right-0 z-40 h-full w-72 bg-bg-base shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Mobile navigation"
        aria-modal={open ? "true" : undefined}
        aria-hidden={!open}
      >
        <div className="flex flex-col gap-1 p-6">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
            >
              <span className="block py-3 text-lg">{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="absolute bottom-8 px-6 text-sm text-text-muted space-y-1">
          <p>
            <a
              href={siteConfig.contact.phoneHref}
              className="hover:text-text-primary transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
