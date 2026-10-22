import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { Container } from "@/components/ui/Container";
import { TRACK_COOKIE } from "@/lib/config/track";

const LEGAL_LINKS = [
  { href: "/legal/privacy", key: "legalPrivacy" },
  { href: "/legal/cookies", key: "legalCookies" },
  { href: "/legal/terms", key: "legalTerms" },
  { href: "/legal/delivery", key: "legalDelivery" },
  { href: "/legal/license", key: "legalLicense" },
] as const;

export async function Footer() {
  const year = new Date().getFullYear();
  const t = await getTranslations("footer");
  const cookieStore = await cookies();
  // Serious Games is the no-pink B2B track (see Button.tsx's "Alt" variants
  // and src/app/[locale]/(site)/serious-games/page.tsx) — the footer follows
  // the same rule via the track cookie proxy.ts sets on /serious-games visits.
  const headingColor =
    cookieStore.get(TRACK_COOKIE)?.value === "serious-games"
      ? "text-brand-cyan"
      : "text-ink";

  return (
    <footer className="border-line bg-mist border-t">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="text-ink/70 mt-3 text-sm">{t("tagline")}</p>
        </div>

        <div>
          <h4 className={`${headingColor} mb-3 text-sm font-semibold`}>{t("shopHeading")}</h4>
          <ul className="text-ink space-y-2 text-sm">
            <li><Link href="/shop">{t("shopAll")}</Link></li>
            <li><Link href="/free-designs">{t("shopFree")}</Link></li>
            <li><Link href="/business">{t("shopBusiness")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className={`${headingColor} mb-3 text-sm font-semibold`}>{t("legalHeading")}</h4>
          <ul className="text-ink space-y-2 text-sm">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{t(link.key)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className={`${headingColor} mb-3 text-sm font-semibold`}>{t("newsletterHeading")}</h4>
          <p className="text-ink/70 mb-3 text-sm">{t("newsletterDescription")}</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder={t("newsletterPlaceholder")}
              disabled
              className="border-line bg-paper w-full rounded-full border px-4 py-2 text-sm disabled:opacity-60"
            />
          </div>
        </div>
      </Container>

      <Container className="border-line text-ink/60 flex flex-col gap-2 border-t py-6 text-xs sm:flex-row sm:justify-between">
        <span>© {year} {t("copyright")}</span>
        <span>{t("digitalOnly")}</span>
      </Container>
    </footer>
  );
}
