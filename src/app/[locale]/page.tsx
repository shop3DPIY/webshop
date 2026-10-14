import Image from "next/image";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { TRACK_COOKIE, isTrack } from "@/lib/config/track";

/**
 * The site's entry point is a choice, not a storefront — Dolls & Mini and
 * Serious Games are different audiences with a different "vibe" and (for
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

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <Image
        src="/images/banner/Banner_3DPIY.png"
        alt=""
        fill
        priority
        className="object-cover"
        aria-hidden
      />

      <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-8">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/30 bg-white/15 px-8 py-6 text-center shadow-xl backdrop-blur-lg">
          <Image
            src="/images/logo/Logo_3DPIY-transparent.png"
            alt="3DPIY"
            width={334}
            height={216}
            priority
            className="h-16 w-auto sm:h-20"
          />
          <h1 className="font-display text-xl font-bold text-white sm:text-2xl">{t("title")}</h1>
          <p className="max-w-md text-sm text-white/80 sm:text-base">{t("description")}</p>
        </div>

        <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
          <Link
            href="/dolls"
            className="group border-brand-pink hover:bg-brand-pink/25 bg-brand-pink/15 flex flex-col items-start gap-3 rounded-3xl border-2 p-8 text-left shadow-xl backdrop-blur-lg transition-colors"
          >
            <span className="bg-brand-pink inline-flex h-10 w-10 items-center justify-center rounded-full" />
            <h2 className="font-display text-2xl font-semibold text-white">{t("dollsTitle")}</h2>
            <p className="text-sm text-white/80">{t("dollsDescription")}</p>
            <span className="mt-2 text-sm font-semibold text-white">{t("dollsCta")} →</span>
          </Link>

          <Link
            href="/serious-games"
            className="group border-brand-purple hover:bg-brand-purple/25 bg-brand-purple/15 flex flex-col items-start gap-3 rounded-3xl border-2 p-8 text-left shadow-xl backdrop-blur-lg transition-colors"
          >
            <span className="bg-brand-purple inline-flex h-10 w-10 items-center justify-center rounded-full" />
            <h2 className="font-display text-2xl font-semibold text-white">
              {t("seriousGamesTitle")}
            </h2>
            <p className="text-sm text-white/80">{t("seriousGamesDescription")}</p>
            <span className="mt-2 text-sm font-semibold text-white">
              {t("seriousGamesCta")} →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
