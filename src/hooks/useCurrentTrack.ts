"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "@/i18n/navigation";
import { TRACK_COOKIE, parseTrack, type Track } from "@/lib/config/track";

/** TrackSync announces a newly picked track (?track=…) with this event. */
export const TRACK_EVENT = "3dpiy-track";
const subscribe = (onChange: () => void) => {
  window.addEventListener(TRACK_EVENT, onChange);
  return () => window.removeEventListener(TRACK_EVENT, onChange);
};

function readCookieTrack(): Track | undefined {
  const value = document.cookie.match(
    new RegExp(`(?:^|; )${TRACK_COOKIE}=([^;]*)`),
  )?.[1];
  return parseTrack(value);
}

/**
 * The track the visitor is in right now: from the URL when it says so
 * (/dolls, /business), else the last-picked track cookie. Read on the
 * client so it stays correct across client-side navigation — server
 * layouts get reused by Next.js's router cache and would go stale.
 * Returns undefined when neither says (e.g. a first visit to /about).
 */
export function useCurrentTrack(): Track | undefined {
  const pathname = usePathname();
  const cookieTrack = useSyncExternalStore(
    subscribe,
    readCookieTrack,
    () => undefined,
  );
  if (pathname === "/dolls" || pathname.startsWith("/dolls/")) return "dolls";
  if (pathname === "/business" || pathname.startsWith("/business/")) {
    return "business";
  }
  return cookieTrack;
}
