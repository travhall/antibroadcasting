"use client";

import { useTheme, type Theme } from "@/lib/hooks/useTheme";

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      suppressHydrationWarning
      className={`flex items-center gap-3 ${className || ""}`}
    >
      {THEMES.map(({ value, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            className={[
              "tap-target font-mono text-3xs uppercase tracking-widest transition-colors whitespace-nowrap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-none",
              isActive
                ? "text-text-accent"
                : "text-text-tertiary hover:text-text-secondary",
            ].join(" ")}
          >
            {/* Brackets wrap the active label — unambiguous, no extra color needed */}
            {isActive ? `[ ${label} ]` : label}
          </button>
        );
      })}
    </div>
  );
}
