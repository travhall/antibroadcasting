"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get stored theme or default to system
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      applyTheme(prefersDark ? "dark" : "light");
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (!stored || stored === "system") {
        applyTheme(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const isDark =
      newTheme === "dark" ||
      (newTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  if (!mounted) {
    return (
      <div className="w-28 h-8 bg-neutral-200 rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg">
      <button
        onClick={() => handleThemeChange("light")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "light"
            ? "bg-white dark:bg-neutral-700 shadow-sm"
            : "hover:bg-neutral-300 dark:hover:bg-neutral-600"
        }`}
        aria-label="Light mode"
        title="Light"
      >
        <svg
          className="w-4 h-4 text-neutral-700 dark:text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </button>
      <button
        onClick={() => handleThemeChange("dark")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "dark"
            ? "bg-white dark:bg-neutral-700 shadow-sm"
            : "hover:bg-neutral-300 dark:hover:bg-neutral-600"
        }`}
        aria-label="Dark mode"
        title="Dark"
      >
        <svg
          className="w-4 h-4 text-neutral-700 dark:text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>
      <button
        onClick={() => handleThemeChange("system")}
        className={`p-1.5 rounded-md transition-colors ${
          theme === "system"
            ? "bg-white dark:bg-neutral-700 shadow-sm"
            : "hover:bg-neutral-300 dark:hover:bg-neutral-600"
        }`}
        aria-label="System preference"
        title="System"
      >
        <svg
          className="w-4 h-4 text-neutral-700 dark:text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
  );
}
