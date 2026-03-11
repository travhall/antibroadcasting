"use client";

import { useState, useEffect } from "react";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Portfolio", href: "/portfolio" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Get a Quote", href: "/contact" },
];

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
        active ? "text-zinc-900 font-semibold" : "text-zinc-500 hover:text-zinc-900"
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
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200">
        <Link href="/" className="font-bold tracking-tight text-lg">
          Antibroadcasting
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
            className={`block h-0.5 w-full bg-zinc-900 transition-transform origin-center ${
              open ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-zinc-900 transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-zinc-900 transition-transform origin-center ${
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
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <span className="font-bold tracking-tight">Menu</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-zinc-500 hover:text-zinc-900"
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
              <span className="block py-3 text-lg border-b border-zinc-100">
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>
        <div className="absolute bottom-8 px-6 text-sm text-zinc-400 space-y-1">
          <p>
            <a href="tel:6128369488" className="hover:text-zinc-900 transition-colors">
              612.836.9488
            </a>
          </p>
          <p>Minneapolis, MN</p>
        </div>
      </nav>
    </>
  );
}
