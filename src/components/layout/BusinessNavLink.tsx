"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrentTrack } from "@/hooks/useCurrentTrack";

/**
 * Commercial licensing only exists on the Business track, so this
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
  if (useCurrentTrack() !== "business") return null;
  const link = (
    <Link href="/business" className={className}>
      {label ?? t("business")}
    </Link>
  );
  return asListItem ? <li>{link}</li> : link;
}
