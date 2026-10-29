import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LogoImage } from "@/components/layout/LogoImage";
import { getTrackCollections } from "@/lib/config/colors";

/**
 * The site's entry point is a choice, not a storefront — the 3DPIY Shop
 * (every Dolls-track collection) and 3DPIY Business (every Business-track
 * collection, starting with Serious Games) are different audiences with a
 * different "vibe" and (for Business) commercial licenses, so they get their own
 * landing pages instead of being mixed into one generic homepage. This page
 * has no navbar/footer at all (see the (site) route group next to it) —
 * it's a standalone start screen, not part of the regular site chrome.
 *
 * Always shown — also to returning visitors (the track cookie set in
 * proxy.ts only keeps the header/footer on the right track elsewhere).
 */
export default async function TrackChooserPage() {
  const t = await getTranslations("trackChooser");
  const tCollections = await getTranslations("collections.items");
  const shopCollections = getTrackCollections("dolls");
  const businessCollections = getTrackCollections("business");

  return (
    // min-h, not h-screen + overflow-hidden: on phones the tiles are taller
    // than the screen and the panel got cut off top and bottom.
    <div className="relative min-h-dvh w-full">
      <div className="relative flex min-h-dvh w-full flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 rounded-xl p-5 text-center sm:p-10 glass">
          <div className="flex flex-col items-center gap-3">
            <LogoImage variant="chooser" priority className="h-24 w-auto sm:h-32" />
            <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">
              {t("title")}
            </h1>
            <p className="text-sm text-ink/80 sm:text-base">
              {t("description")}
            </p>
          </div>

          <div className="grid w-full gap-5 sm:grid-cols-3">
            <Link
              href="/dolls"
              data-umami-event="chooser-shop"
              className="group glass hover:bg-white/25 flex flex-col items-start gap-3 rounded-3xl p-6 text-left sm:p-8 transition-colors sm:col-span-2"
            >
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t("dollsTitle")}
              </h2>
              <p className="text-sm text-ink/80">{t("dollsDescription")}</p>
              <ul className="grid w-full grid-cols-2 gap-2">
                {shopCollections.map((c) => (
                  <li
                    key={c.slug}
                    className="flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium text-ink backdrop-blur-lg"
                    style={{
                      borderColor: c.color,
                      backgroundColor: `${c.color}33`,
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                      aria-hidden
                    />
                    <span className="truncate">
                      {tCollections(`${c.slug}.name`)}
                    </span>
                  </li>
                ))}
              </ul>
              <span className="mt-auto text-sm font-semibold text-ink">
                {t("dollsCta")} →
              </span>
            </Link>

            <Link
              href="/business"
              data-umami-event="chooser-business"
              className="group glass hover:bg-white/25 flex flex-col items-start gap-3 rounded-3xl p-6 text-left sm:p-8 transition-colors"
            >
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t("businessTitle")}
              </h2>
              <p className="text-sm text-ink/80">
                {t("businessDescription")}
              </p>
              <ul className="grid w-full grid-cols-1 gap-2">
                {businessCollections.map((c) => (
                  <li
                    key={c.slug}
                    className="flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium text-ink backdrop-blur-lg"
                    style={{
                      borderColor: c.color,
                      backgroundColor: `${c.color}33`,
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                      aria-hidden
                    />
                    <span className="truncate">
                      {tCollections(`${c.slug}.name`)}
                    </span>
                  </li>
                ))}
              </ul>
              <span className="mt-auto text-sm font-semibold text-ink">
                {t("businessCta")} →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
