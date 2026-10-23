import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { LogoImage } from "@/components/layout/LogoImage";
import { TRACK_COOKIE, isTrack } from "@/lib/config/track";
import { getTrackCollections } from "@/lib/config/colors";

/**
 * The site's entry point is a choice, not a storefront — the 3DPIY Shop
 * (every Dolls-track collection) and Serious Games are different audiences with a different "vibe" and (for
 * Serious Games) a different commercial license, so they get their own
 * landing pages instead of being mixed into one generic homepage. This page
 * has no navbar/footer at all (see the (site) route group next to it) —
 * it's a standalone start screen, not part of the regular site chrome.
 *
 * A returning visitor skips straight to their track (see proxy.ts, which
 * sets this cookie on any /dolls or /serious-games request) — ?pick=1
 * (used by the logo, see Logo.tsx) always forces this chooser back open.
 */
export default async function TrackChooserPage({
  searchParams,
}: {
  searchParams: Promise<{ pick?: string }>;
}) {
  const { pick } = await searchParams;
  if (!pick) {
    const cookieStore = await cookies();
    const track = cookieStore.get(TRACK_COOKIE)?.value;
    if (isTrack(track)) {
      redirect({ href: `/${track}`, locale: await getLocale() });
    }
  }

  const t = await getTranslations("trackChooser");
  const tCollections = await getTranslations("collections.items");
  const shopCollections = getTrackCollections("dolls");

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="relative flex h-full w-full flex-col items-center justify-center px-6 py-8">
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 rounded-xl p-8 text-center sm:p-10 glass">
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
              className="group glass hover:bg-white/25 flex flex-col items-start gap-3 rounded-3xl p-8 text-left transition-colors sm:col-span-2"
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
              href="/serious-games"
              className="group border-brand-purple bg-brand-purple/15 hover:bg-brand-purple/45 flex flex-col items-start gap-3 rounded-3xl border p-8 text-left shadow-xl backdrop-blur-lg transition-colors"
            >
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t("seriousGamesTitle")}
              </h2>
              <p className="text-sm text-ink/80">
                {t("seriousGamesDescription")}
              </p>
              <span className="mt-auto text-sm font-semibold text-ink">
                {t("seriousGamesCta")} →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
