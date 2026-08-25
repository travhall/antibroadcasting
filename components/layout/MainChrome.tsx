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

  return (
    <main
      id="main-content"
      className={`flex flex-col min-h-screen md:min-h-[calc(100vh-4.5rem)] ${hasAlert ? "mt-27 lg:mt-43" : "mt-16 lg:mt-32"} px-4 md:px-6 lg:px-8 xl:px-12 pb-0 bg-bg-base relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
    >
      {children}
    </main>
  );
}
