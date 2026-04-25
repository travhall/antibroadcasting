"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

const FLOOD_MS = 400;
const PRINT_MS = 400;

type TransitionContextValue = {
  startTransition: (navigate: () => void) => void;
};

const TransitionContext = createContext<TransitionContextValue>({
  startTransition: (fn) => fn(),
});

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const startTransition = useCallback((navigate: () => void) => {
    // Tear down any overlay from an interrupted transition
    overlayRef.current?.remove();
    overlayRef.current = null;

    // Create the overlay outside React's DOM — it has no React lifecycle
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:200;background:var(--bg-subtle);pointer-events:none;transform:translateY(-100%)";
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    // Phase 1: flood — wipe down to cover the page
    const flood = overlay.animate(
      [{ transform: "translateY(-100%)" }, { transform: "translateY(0)" }],
      { duration: FLOOD_MS, easing: "ease-out", fill: "forwards" }
    );

    flood.onfinish = () => {
      navigate();

      // Phase 2: print — continue down to reveal the new page
      const print = overlay.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }],
        { duration: PRINT_MS, easing: "ease-out", fill: "forwards" }
      );

      print.onfinish = () => {
        overlay.remove();
        if (overlayRef.current === overlay) overlayRef.current = null;
      };
    };
  }, []);

  return (
    <TransitionContext.Provider value={{ startTransition }}>
      {children}
    </TransitionContext.Provider>
  );
}

export const usePageTransition = () => useContext(TransitionContext);
