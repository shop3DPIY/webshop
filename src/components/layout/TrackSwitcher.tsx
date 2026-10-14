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
export function TrackSwitcher() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  if (pathname === "/dolls" || pathname.startsWith("/dolls/")) {
    return (
      <Link
        href="/serious-games"
        className="border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10 hidden rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex"
      >
        {t("switchToSeriousGames")}
      </Link>
    );
  }

  if (pathname === "/serious-games" || pathname.startsWith("/serious-games/")) {
    return (
      <Link
        href="/dolls"
        className="border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10 hidden rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex"
      >
        {t("switchToDolls")}
      </Link>
    );
  }

  return null;
}
