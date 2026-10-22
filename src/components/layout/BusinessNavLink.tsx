"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrentTrack } from "@/hooks/useCurrentTrack";

/**
 * Business/commercial licensing only exists for Serious Games, so this
 * renders nothing on the Shop side. `asListItem` wraps it in an <li> for
 * the footer's link list.
 */
export function BusinessNavLink({
  className,
  label,
  asListItem = false,
}: {
  className?: string;
  label?: string;
  asListItem?: boolean;
}) {
  const t = useTranslations("nav");
  if (useCurrentTrack() !== "serious-games") return null;
  const link = (
    <Link href="/business" className={className}>
      {label ?? t("business")}
    </Link>
  );
  return asListItem ? <li>{link}</li> : link;
}
