"use client";

import { forwardRef } from "react";
import { useRouter } from "next/navigation";
import { usePageTransition } from "./PageTransitionProvider";
import type { ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<"a">, "onClick"> & {
  href: string;
  onClick?: () => void;
};

export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(
  function TransitionLink({ href, children, onClick, ...props }, ref) {
    const router = useRouter();
    const { startTransition } = usePageTransition();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Let modifier-key clicks fall through (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Skip transition on same-page links
      if (new URL(href, window.location.origin).pathname === window.location.pathname) return;
      e.preventDefault();
      onClick?.();
      startTransition(() => router.push(href));
    };

    return (
      <a ref={ref} href={href} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  }
);
