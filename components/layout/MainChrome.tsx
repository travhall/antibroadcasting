"use client";

import type { ReactNode } from "react";
import type { ActiveAlert } from "@/lib/get-active-alert";
import { useAlertVisible } from "@/lib/alert-visibility";

export function MainChrome({
  activeAlert,
  children,
}: {
  activeAlert: ActiveAlert | null;
  children: ReactNode;
}) {
  const hasAlert = useAlertVisible(activeAlert);

  // <main> is a landmark, not a control: the router and the skip link focus it
  // programmatically, so it takes no visible focus ring (it read as a stray rule).
  return (
    <main
      id="main-content"
      className={`flex flex-col flex-1 ${hasAlert ? "mt-27 lg:mt-43" : "mt-16 lg:mt-32"} px-4 md:px-6 lg:px-8 xl:px-12 pb-0 bg-bg-base relative z-10 focus:outline-none`}
    >
      {children}
    </main>
  );
}
