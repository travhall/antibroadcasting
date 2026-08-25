"use client";

import type { CSSProperties } from "react";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { PulseDot } from "@/components/ui/PulseDot";
import type { ActiveAlert } from "@/lib/get-active-alert";
import { useAlertVisible, dismissAlert } from "@/lib/alert-visibility";

export function AlertBanner({ alert }: { alert: ActiveAlert }) {
  const visible = useAlertVisible(alert);
  if (!visible) return null;

  function handleDismiss() {
    dismissAlert(alert);
  }

  if (alert.type === "ticker") {
    // The two-copy "translate by -50%" loop trick is only seamless if the two
    // copies together are at least as wide as the browser window — otherwise
    // there's a stretch of genuinely empty bar before it wraps. So each copy
    // repeats the message enough times to overflow any realistic window width,
    // not just once. Duration scales with the resulting total length to keep
    // a constant, comfortable reading pace regardless of message length.
    const CHAR_PX = 9; // rough width per char at text-xs font-mono tracking-widest
    const SEPARATOR_PX = 64; // matches the mx-8 gap around the bullet
    const MIN_COPY_PX = 4000; // safely overflows very wide/ultra-wide windows
    const PX_PER_SECOND = 60;

    const unitPx = alert.message.length * CHAR_PX + SEPARATOR_PX;
    const repeats = Math.max(1, Math.ceil(MIN_COPY_PX / unitPx));
    const duration = Math.max(10, (repeats * unitPx) / PX_PER_SECOND);

    return (
      <div
        role="status"
        className="fixed top-0 inset-x-0 z-101 h-11 flex items-center bg-bg-warning border-b border-border-warning overflow-hidden"
      >
        <div
          className="marquee-track"
          style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
        >
          {[0, 1].map((copyIndex) => (
            <span
              key={copyIndex}
              aria-hidden={copyIndex === 1}
              className="flex items-center shrink-0"
            >
              {Array.from({ length: repeats }).map((_, i) => (
                <span
                  key={i}
                  className="flex items-center shrink-0 font-mono text-xs uppercase tracking-widest whitespace-nowrap text-text-warning"
                >
                  {alert.message}
                  <span aria-hidden="true" className="mx-8 text-text-warning/40">
                    •
                  </span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-101 h-11 flex items-center gap-3 bg-bg-warning border-b border-border-warning px-4 md:px-6 lg:px-8 xl:px-12"
    >
      <PulseDot color="bg-text-warning" />
      <div
        className="flex-1 min-w-0 truncate"
        title={alert.title ? `${alert.title} — ${alert.message}` : alert.message}
      >
        {alert.title && (
          <span className="font-mono text-xs uppercase tracking-widest font-bold text-text-warning mr-2">
            {alert.title}
          </span>
        )}
        <span className="text-sm text-text-warning">{alert.message}</span>
      </div>
      {alert.ctaLabel && alert.ctaHref && (
        <TransitionLink
          href={alert.ctaHref}
          className="font-mono text-xs uppercase tracking-widest underline hover:no-underline text-text-warning shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-warning"
        >
          {alert.ctaLabel}
        </TransitionLink>
      )}
      {alert.dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 text-text-warning/70 hover:text-text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-warning"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
