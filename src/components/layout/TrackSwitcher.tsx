"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrentTrack } from "@/hooks/useCurrentTrack";

/**
 * Shown on every page, pointing to the *other* track. The current track
 * comes from the URL when it says so (/dolls, /business) and from the
 * track cookie everywhere else (product, account, about, ...).
 *
 * Both are read on the client on every render — usePathname re-runs on
 * each client-side navigation, and the cookie is re-read alongside it —
 * rather than in a shared server layout, which Next.js's router cache
 * reuses across /dolls <-> /business navigations (so a cookie read
 * there kept showing whichever track was current the *first* time the
 * layout rendered).
 */
const SwitchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </svg>
);

export function TrackSwitcher() {
  const t = useTranslations("nav");
  const current = useCurrentTrack() ?? "dolls";
  const target = current === "dolls" ? "business" : "dolls";
  const label = t(
    target === "business" ? "switchToBusiness" : "switchToDolls",
  );

  return (
    <Link
      href={`/${target}`}
      title={label}
      data-umami-event={`switch-to-${target}`}
      className="group flex items-center gap-2 text-sm font-medium text-ink"
    >
      <span className="border-line bg-mist group-hover:border-brand-purple group-hover:bg-brand-purple/45 group-hover:text-white flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors">
        <SwitchIcon />
      </span>
      {/* Spelled out so both sides are easy to find, except where the header
          is tight (phones, and md before lg when the center nav appears);
          there the icon alone (plus the title/aria text) keeps the room. */}
      <span className="group-hover:text-brand-purple sr-only whitespace-nowrap transition-colors sm:not-sr-only md:sr-only lg:not-sr-only">
        {label}
      </span>
    </Link>
  );
}
