"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { type SiteInfo } from "@/lib/get-site-info";
import { TransitionLink } from "./TransitionLink";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";
import { DotOverlay } from "../ui/DotOverlay";
import { PhoneIcon, MailIcon } from "@/components/ui/Icons";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import type { ActiveAlert } from "@/lib/get-active-alert";
import { useAlertVisible } from "@/lib/alert-visibility";

const nav = siteConfig.navigation;
const DRAWER_ID = "mobile-nav";
const SCROLL_HIDE_THRESHOLD = 8;

// Focusable elements selector used by the focus trap
const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function NavLink({
  href,
  pathname,
  children,
  onClick,
  className,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const active = pathname === href;
  return (
    <TransitionLink
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative border-b-3 border-transparent transition-colors self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        active
          ? "pointer-events-none lg:border-b-text-accent"
          : "text-text-secondary"
      } ${className || ""}`}
    >
      {children}
    </TransitionLink>
  );
}

export function Header({
  siteInfo,
  activeAlert = null,
}: {
  siteInfo: SiteInfo;
  activeAlert?: ActiveAlert | null;
}) {
  const hasAlert = useAlertVisible(activeAlert);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  const drawerRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const logoCleanup = useRef<(() => void) | null>(null);

  const pathname = usePathname();

  // ── Close drawer on navigation ──────────────────────────────────────────────
  // Adjusts state during render (React-recommended pattern) instead of an
  // effect, so the drawer closes in the same commit as the navigation rather
  // than one render later. Uses state (not a ref) because React Compiler
  // forbids reading/writing refs during render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // ── Logo hover animation ────────────────────────────────────────────────────

  const handleLogoEnter = useCallback(() => {
    const el = logoRef.current;
    if (!el) return;
    logoCleanup.current?.();
    logoCleanup.current = null;
    el.style.animation = "none";
    void el.offsetWidth; // force reflow to restart animation
    el.style.animation = "logo-hover-in 275ms ease forwards";
  }, []);

  const handleLogoLeave = useCallback(() => {
    const el = logoRef.current;
    if (!el) return;
    logoCleanup.current?.();

    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "logo-hover-out 275ms ease forwards";

    const onEnd = () => {
      el.removeEventListener("animationend", onEnd);
      logoCleanup.current = null;
      el.style.animation = "none";
      el.style.backgroundPosition = "0 100%";
      requestAnimationFrame(() => {
        el.style.backgroundPosition = "";
        el.style.animation = "";
      });
    };
    el.addEventListener("animationend", onEnd);
    logoCleanup.current = () => el.removeEventListener("animationend", onEnd);
  }, []);

  // ── Scroll-hide header ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      if (currentY < 10) {
        setHidden(false);
      } else if (diff > SCROLL_HIDE_THRESHOLD) {
        setHidden(true);
      } else if (diff < -SCROLL_HIDE_THRESHOLD) {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Body overflow lock + page-body inert ───────────────────────────────────
  // When the drawer is open: lock scroll AND mark page siblings inert so AT
  // browse mode can't wander outside the drawer (supplements the focus trap).
  // useLayoutEffect (not useEffect) so the cleanup runs synchronously before
  // the browser paints — prevents a frame where main is inert but the new page
  // is already visible after a navigation triggered while the drawer was open.

  useBodyScrollLock(open);

  // Make main content and footer inert while the drawer is open so screen
  // readers in browse/virtual mode can't reach off-screen content.
  useLayoutEffect(() => {
    const siblings: HTMLElement[] = Array.from(
      document.querySelectorAll<HTMLElement>("main, footer"),
    );
    siblings.forEach((el) => {
      if (open) {
        el.setAttribute("inert", "");
      } else {
        el.removeAttribute("inert");
      }
    });

    return () => {
      siblings.forEach((el) => el.removeAttribute("inert"));
    };
  }, [open]);

  // ── Focus trap + Escape key + focus restore ─────────────────────────────────
  // Runs when drawer opens. Cleanup fires when it closes, restoring focus to
  // the hamburger button so keyboard users don't lose their place.

  useEffect(() => {
    if (!open) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const getFocusable = () =>
      Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE));

    // Move focus into the drawer immediately
    getFocusable()[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const hamburger = hamburgerRef.current;
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      hamburger?.focus();
    };
  }, [open]);

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-150 focus-visible:rounded-input focus-visible:bg-bg-base focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Skip to main content
      </a>

      <header
        className={`fixed ${hasAlert ? "top-11" : "top-0"} left-0 right-0 z-100 px-4 md:px-6 lg:px-8 xl:px-12 flex items-center justify-between bg-bg-base border-b border-foreground/10 transition-transform duration-300 ease-in-out ${hidden ? "-translate-y-full" : "translate-y-0"}`}
        onFocus={() => setHidden(false)}
      >
        <div className="w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto flex flex-1 items-center gap-2">
          <TransitionLink
            href="/"
            className="flex items-center gap-2 p-1 my-4 mr-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onMouseEnter={handleLogoEnter}
            onMouseLeave={handleLogoLeave}
          >
            <Logo ref={logoRef} className="h-9 sm:h-10 lg:h-8" />
            <span className="sr-only">{siteInfo.company.nickname}</span>
          </TransitionLink>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center self-end gap-0.5"
          >
            {nav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                className="hover:text-ink text-lg font-display uppercase tracking-widest font-medium px-5 py-9 relative overflow-hidden before:absolute before:inset-0 before:-z-10 before:transform before:scale-y-0 before:origin-bottom before:transition-transform before:duration-300 before:ease-in-out hover:before:scale-y-100 hover:before:origin-top before:bg-gold transition-all"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex grow justify-end self-center items-center gap-4">
            <div className="flex items-center gap-6 text-xs">
              <a
                href={siteInfo.contact.phoneHref}
                className="flex items-center gap-1 font-medium text-text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Call ${siteInfo.contact.phone}`}
              >
                <PhoneIcon className="w-4 h-4 shrink-0" />
                <span className="hidden font-mono uppercase tracking-widest text-sm xl:inline">
                  {siteInfo.contact.phone}
                </span>
              </a>
              {/* <a
                href={`mailto:${siteInfo.contact.email}`}
                className="flex items-center gap-1 font-medium text-text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Email ${siteInfo.contact.email}`}
              >
                <MailIcon className="w-4 h-4 shrink-0" />
                <span className="hidden font-mono uppercase tracking-widest text-sm 2xl:inline">
                  {siteInfo.contact.email}
                </span>
              </a> */}
              <Button asChild variant="outline" size="sm">
                <TransitionLink href="/contact">Get a Quote</TransitionLink>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          ref={hamburgerRef}
          className="lg:hidden flex flex-col justify-center gap-1.5 w-8 h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={DRAWER_ID}
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

      {/* Full-screen mobile nav — slides up from the bottom, countering the
          page-transition's top-down wipe. The header floats above it at z-100
          so the hamburger → X button remains visible and clickable. */}
      <nav
        ref={drawerRef}
        id={DRAWER_ID}
        className={`fixed inset-0 z-40 flex flex-col overflow-hidden lg:hidden
          bg-bg-menu
          transition-transform duration-450 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${open ? "translate-y-0" : "translate-y-full"}`}
        aria-label="Mobile navigation"
        aria-hidden={!open}
        inert={!open || undefined}
      >
        {/* Subtle dot-texture overlay — mirrors the CtaBand pattern */}
        <DotOverlay color="oklch(96% 0.012 75)" size="14px" opacity={0.04} />

        {/* Bottom corner brackets */}
        <div
          aria-hidden="true"
          className="absolute bottom-6 left-6 w-7 h-7 border-b border-l border-border-menu pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-6 right-6 w-7 h-7 border-b border-r border-border-menu pointer-events-none"
        />

        {/* Spacer that clears the fixed header */}
        <div className="flex-none h-24" aria-hidden="true" />

        {/* Index label */}
        <div className="flex items-center gap-4 px-6 pb-5">
          <span aria-hidden="true" className="block h-px w-8 bg-border-menu" />
          <span className="font-mono text-3xs uppercase tracking-widest text-text-menu-subtle">
            Navigation
          </span>
        </div>

        {/* Nav items — large display type with staggered fade-in */}
        <div className="flex-1 flex flex-col px-6 overflow-hidden min-h-0">
          {nav.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <div
                key={item.href}
                className="border-t border-border-menu transition-[opacity,transform] duration-500 ease-out"
                style={{
                  transitionDelay: open ? `${80 + i * 55}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "none" : "translateY(10px)",
                }}
              >
                <TransitionLink
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className="group flex items-center gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-menu"
                >
                  <span className="font-mono text-3xs uppercase tracking-widest text-text-menu-accent shrink-0 w-5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`font-display font-black uppercase leading-none transition-colors duration-200 text-[clamp(1.875rem,8vw,3rem)] ${
                      isActive
                        ? "text-text-accent"
                        : "text-text-menu group-hover:text-text-accent"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="ml-auto font-mono text-xs text-text-menu-subtle group-hover:text-gold transition-colors duration-200"
                  >
                    →
                  </span>
                </TransitionLink>
              </div>
            );
          })}
          {/* Closing rule */}
          <div className="border-t border-border-menu" />
        </div>

        {/* CTA + contact strip */}
        <div
          className="flex-none px-6 pt-5 pb-8 border-t border-border-menu transition-opacity duration-500 ease-out"
          style={{
            transitionDelay: open ? `${80 + nav.length * 55}ms` : "0ms",
            opacity: open ? 1 : 0,
          }}
        >
          <Button asChild variant="primary" size="sm" className="w-full mb-4">
            <TransitionLink href="/contact" onClick={() => setOpen(false)}>
              Get a Quote →
            </TransitionLink>
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-x-8 px-4 gap-y-1.5">
            <a
              href={siteInfo.contact.phoneHref}
              className="font-mono text-xs uppercase tracking-widest text-text-menu-dim hover:text-text-menu transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
              aria-label={`Call ${siteInfo.contact.phone}`}
            >
              {siteInfo.contact.phone}
            </a>
            <span className="font-mono text-xs uppercase tracking-widest text-text-menu-subtle">
              {siteInfo.contact.address.location}
            </span>
          </div>
        </div>
      </nav>
    </>
  );
}
