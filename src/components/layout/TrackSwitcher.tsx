"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Deliberately driven by the current URL (via usePathname, which re-runs on
 * every client-side navigation) rather than the track cookie read in a
 * shared server layout — that layout is reused across /dolls <-> /serious-
 * games navigations by Next.js's router cache, so a cookie read there kept
 * showing whichever track was current the *first* time the layout rendered.
 */
const SwitchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

export function TrackSwitcher() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  if (pathname === "/dolls" || pathname.startsWith("/dolls/")) {
    return (
      <Link
        href="/serious-games"
        aria-label={t("switchToSeriousGames")}
        title={t("switchToSeriousGames")}
        className="border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10 flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
      >
        <SwitchIcon />
      </Link>
    );
  }

  if (pathname === "/serious-games" || pathname.startsWith("/serious-games/")) {
    return (
      <Link
        href="/dolls"
        aria-label={t("switchToDolls")}
        title={t("switchToDolls")}
        className="border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10 flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
      >
        <SwitchIcon />
      </Link>
    );
  }

  return null;
}
