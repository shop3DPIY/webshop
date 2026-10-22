"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "@/i18n/navigation";
import { TRACK_COOKIE, isTrack, type Track } from "@/lib/config/track";

const noSubscribe = () => () => {};

function readCookieTrack(): Track | undefined {
  const value = document.cookie.match(
    new RegExp(`(?:^|; )${TRACK_COOKIE}=([^;]*)`),
  )?.[1];
  return isTrack(value) ? value : undefined;
}

/**
 * The track the visitor is in right now: from the URL when it says so
 * (/dolls, /serious-games), else the last-picked track cookie. Read on the
 * client so it stays correct across client-side navigation — server
 * layouts get reused by Next.js's router cache and would go stale.
 * Returns undefined when neither says (e.g. a first visit to /about).
 */
export function useCurrentTrack(): Track | undefined {
  const pathname = usePathname();
  const cookieTrack = useSyncExternalStore(
    noSubscribe,
    readCookieTrack,
    () => undefined,
  );
  if (pathname === "/dolls" || pathname.startsWith("/dolls/")) return "dolls";
  if (pathname === "/serious-games" || pathname.startsWith("/serious-games/")) {
    return "serious-games";
  }
  return cookieTrack;
}
