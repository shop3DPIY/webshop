"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { TRACK_COOKIE, isTrack, type Track } from "@/lib/config/track";

/**
 * Shown on every page, pointing to the *other* track. The current track
 * comes from the URL when it says so (/dolls, /serious-games) and from the
 * track cookie everywhere else (product, account, about, ...).
 *
 * Both are read on the client on every render — usePathname re-runs on
 * each client-side navigation, and the cookie is re-read alongside it —
 * rather than in a shared server layout, which Next.js's router cache
 * reuses across /dolls <-> /serious-games navigations (so a cookie read
 * there kept showing whichever track was current the *first* time the
 * layout rendered).
 */
const SwitchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

const noSubscribe = () => () => {};

function readCookieTrack(): Track | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${TRACK_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return isTrack(value) ? value : undefined;
}

function trackFromPath(pathname: string): Track | undefined {
  if (pathname === "/dolls" || pathname.startsWith("/dolls/")) return "dolls";
  if (pathname === "/serious-games" || pathname.startsWith("/serious-games/")) {
    return "serious-games";
  }
  return undefined;
}

export function TrackSwitcher() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const cookieTrack = useSyncExternalStore(noSubscribe, readCookieTrack, () => undefined);
  const current = trackFromPath(pathname) ?? cookieTrack ?? "dolls";
  const target = current === "dolls" ? "serious-games" : "dolls";
  const label = t(target === "serious-games" ? "switchToSeriousGames" : "switchToDolls");

  return (
    <Link
      href={`/${target}`}
      aria-label={label}
      title={label}
      className="border-line bg-mist text-ink hover:bg-paper flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
    >
      <SwitchIcon />
    </Link>
  );
}
