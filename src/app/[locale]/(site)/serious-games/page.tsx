import { permanentRedirect } from "next/navigation";
import { getLocale } from "next-intl/server";

/**
 * The Business track's landing page used to live here (before
 * 2026-10-28); old links and bookmarks go to /business now.
 */
export default async function SeriousGamesRedirect() {
  const locale = await getLocale();
  permanentRedirect(locale === "nl" ? "/nl/business" : "/business");
}
