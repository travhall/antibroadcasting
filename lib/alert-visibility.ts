"use client";

import { useSyncExternalStore } from "react";
import type { ActiveAlert } from "@/lib/get-active-alert";

const STORAGE_KEY = "ab-alert-dismissed";

/** Cheap non-cryptographic hash so editing the message resurfaces it for visitors who dismissed the old one. */
function hashContent(alert: ActiveAlert): string {
  const raw = `${alert.title ?? ""}|${alert.message}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

// Dismissing needs to collapse the header's offset and the page's top margin
// in the same tick as the alert itself, so all three read from one shared
// store instead of each re-deriving "is it dismissed" independently.
let dismissedThisLoad = false;

// Once a visitor has scrolled past a small threshold, the banner has done
// its job of being seen — collapse it for the rest of this page load so it
// doesn't permanently eat viewport height. Not persisted to localStorage:
// unlike an explicit dismiss, this should not follow the visitor to their
// next visit or next page navigation.
let scrolledPastThreshold = false;
const SCROLL_COLLAPSE_THRESHOLD_PX = 24;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

if (typeof window !== "undefined") {
  const handleScroll = () => {
    if (window.scrollY > SCROLL_COLLAPSE_THRESHOLD_PX) {
      scrolledPastThreshold = true;
      notify();
      window.removeEventListener("scroll", handleScroll);
    }
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
}

function isStoredAsDismissed(alert: ActiveAlert): boolean {
  if (!alert.dismissible) return false;
  return window.localStorage.getItem(STORAGE_KEY) === hashContent(alert);
}

/** True while `alert` should be shown (and layout should reserve space for it). */
export function useAlertVisible(alert: ActiveAlert | null): boolean {
  const dismissed = useSyncExternalStore(
    subscribe,
    () =>
      dismissedThisLoad ||
      scrolledPastThreshold ||
      (alert !== null && isStoredAsDismissed(alert)),
    () => false,
  );
  return alert !== null && !dismissed;
}

export function dismissAlert(alert: ActiveAlert) {
  if (alert.dismissible) {
    window.localStorage.setItem(STORAGE_KEY, hashContent(alert));
  }
  dismissedThisLoad = true;
  notify();
}
