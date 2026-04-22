"use client";

import { useEffect, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (theme === "dark" || (theme === "system" && prefersDark)) {
    root.classList.add("dark");
    root.classList.remove("light");
  } else if (theme === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.remove("dark");
    root.classList.remove("light");
  }

  root.dataset.theme = theme;
}

export function useTheme() {
  // Always start as "system" so the server render and initial client render
  // match (no hydration mismatch). useLayoutEffect then syncs the real value
  // synchronously before the browser paints — no visible flash.
  const [theme, setThemeState] = useState<Theme>("system");

  useLayoutEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setThemeState(stored);
    // applyTheme is mostly a no-op here since the inline <head> script already
    // set the dark class, but it keeps data-theme and the class list in sync.
    applyTheme(stored);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const current = (localStorage.getItem("theme") as Theme | null) ?? "system";
      if (current === "system") {
        applyTheme("system");
        setThemeState("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return { theme, setTheme };
}
