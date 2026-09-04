"use client";

import { type SiteInfo } from "@/lib/get-site-info";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { RegistrationMark } from "@/components/ui/RegistrationMark";
import { TransitionLink } from "./TransitionLink";
import { ThemeToggle } from "../ui/ThemeToggle";
import { buttonVariants } from "../ui/Button";
import { InstagramIcon, FacebookIcon, XIcon } from "@/components/ui/Icons";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const COL_LINK = `relative text-sm text-text-secondary hover:text-text-accent transition-colors py-1 self-start ${FOCUS_RING}`;

export function Footer({ siteInfo }: { siteInfo: SiteInfo }) {
  return (
    <footer
      className="bg-bg-subtle lg:sticky lg:bottom-0 z-0 border-t border-foreground/10"
      onFocus={(e) => {
        // Only trigger when focus enters the footer from outside — not on every
        // child re-focus. This prevents the jarring scroll-to-bottom firing on
        // each Tab keypress while navigating footer links.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: reduced ? "instant" : "smooth",
        });
      }}
    >
      <div className="w-full max-w-300 xl:max-w-360 2xl:max-w-400 mx-auto px-4 md:px-6 lg:px-8 xl:px-12 pt-16 pb-8">
        {/* ── Main grid ──────────────────────────────────────────────────── cSpell:ignore wordmark antibroad */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 lg:gap-12 pb-12 border-b border-foreground/10">
          {/* Col 1 — Wordmark */}
          <div className="flex flex-col gap-0">
            <span
              aria-hidden="true"
              className="logo-footer block w-full max-w-lg"
              style={{ aspectRatio: "178.22 / 31.48" }}
            />
            <span className="sr-only">{siteInfo.company.legalName}</span>
            <div className="flex items-center gap-2 mt-5">
              <RegistrationMark className="w-3.5 h-3.5 text-text-accent shrink-0" />
              <span className="font-mono text-2xs uppercase tracking-widest text-text-tertiary">
                Artist-Run · Independent · Minneapolis
              </span>
            </div>

            {/* CTA — separated by a thin rule so it reads as a distinct action */}
            <div className="mt-5 pt-5 border-t border-foreground/10">
              <TransitionLink
                href="/contact"
                className={buttonVariants({ variant: "neutral", size: "lg" })}
              >
                Request a Quote →
              </TransitionLink>
            </div>
          </div>

          {/* Col 2 — Visit */}
          <div>
            <p className="font-mono text-2xs uppercase tracking-mega text-text-tertiary mb-5">
              Visit
            </p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(siteInfo.contact.address.full)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${siteInfo.contact.address.full} in Google Maps (opens in new tab)`}
              className={COL_LINK}
            >
              <span className="block">{siteInfo.contact.address.street}</span>
              <span className="block">
                {siteInfo.contact.address.city},{" "}
                {siteInfo.contact.address.state} {siteInfo.contact.address.zip}
              </span>
            </a>
            <p className="font-mono text-2xs uppercase tracking-widest text-text-tertiary mt-4">
              By Appointment Only
            </p>
          </div>

          {/* Col 3 — Get in Touch */}
          <div>
            <p className="font-mono text-2xs uppercase tracking-mega text-text-tertiary mb-5">
              Get in Touch
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-0.5">
              <a
                href={siteInfo.contact.phoneHref}
                className={COL_LINK}
                aria-label={`Call ${siteInfo.contact.phone}`}
              >
                {siteInfo.contact.phone}
              </a>
              <CopyEmailButton email={siteInfo.contact.email} />
            </div>
          </div>

          {/* Col 4 — Elsewhere */}
          <div>
            <p className="font-mono text-2xs uppercase tracking-mega text-text-tertiary mb-5">
              Elsewhere
            </p>
            <div className="flex flex-row lg:flex-col gap-4 lg:gap-1">
              <a
                href={siteInfo.social.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram (opens in new tab)"
                className={`flex items-center gap-2.5 ${COL_LINK}`}
              >
                <InstagramIcon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline-flex">Instagram</span>
              </a>
              <a
                href={siteInfo.social.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook (opens in new tab)"
                className={`flex items-center gap-2.5 ${COL_LINK}`}
              >
                <FacebookIcon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline-flex">Facebook</span>
              </a>
              <a
                href={siteInfo.social.twitter.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter (opens in new tab)"
                className={`flex items-center gap-2.5 ${COL_LINK}`}
              >
                <XIcon className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline-flex">X / Twitter</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────── */}
        {/* Theme toggle + legal links live here — same mono-uppercase register
            as copyright, clearly meta/utility content separate from navigation. */}
        <div className="pt-7 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 font-mono text-2xs uppercase tracking-mega text-text-tertiary">
          <span>
            &copy; {new Date().getFullYear()} {siteInfo.company.legalName} — All
            Rights Reserved.
          </span>
          {/* <span className="flex items-center gap-3">
            <RegistrationMark className="w-3.5 h-3.5" aria-hidden="true" />
            Pressed by Hand
            <RegistrationMark className="w-3.5 h-3.5" aria-hidden="true" />
          </span> */}
          <ThemeToggle />
          <div className="flex items-center gap-4">
            <TransitionLink
              href="/privacy"
              className={`font-mono text-3xs uppercase tracking-widest text-text-tertiary hover:text-text-secondary transition-colors ${FOCUS_RING}`}
            >
              Privacy
            </TransitionLink>
            <TransitionLink
              href="/terms"
              className={`font-mono text-3xs uppercase tracking-widest text-text-tertiary hover:text-text-secondary transition-colors ${FOCUS_RING}`}
            >
              Terms
            </TransitionLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
