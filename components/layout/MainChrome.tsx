"use client";

import type { ReactNode } from "react";

export function MainChrome({ children }: { children: ReactNode }) {
  // <main> is a landmark, not a control: the router and the skip link focus it
  // programmatically, so it takes no visible focus ring (it read as a stray rule).
  return (
    <main
      id="main-content"
      className="flex flex-col flex-1 px-4 md:px-6 lg:px-8 xl:px-12 pb-0 bg-bg-base relative z-10 focus:outline-none"
    >
      {children}
    </main>
  );
}
