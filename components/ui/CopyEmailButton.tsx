"use client";

import { useState } from "react";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — degrade silently
    }
  };

  return (
    <>
      {/* SR live region — copy success announced to AT without visual noise */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Email address copied to clipboard" : ""}
      </span>

      {/* Entire row is the copy trigger — text + icon together */}
      <button
        onClick={handleCopy}
        aria-label={`Copy email address: ${email}`}
        className={`tap-target group flex items-center gap-2 text-sm text-text-secondary hover:text-text-accent transition-colors py-0.5 self-start rounded ${FOCUS_RING}`}
      >
        <span>{email}</span>

        {/* Fixed 14×14 SVG — icon swap causes zero layout shift */}
        {copied ? (
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 text-text-accent"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 text-text-muted group-hover:text-text-accent transition-colors"
          >
            <rect x="9" y="2" width="6" height="4" rx="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
        )}
      </button>
    </>
  );
}
