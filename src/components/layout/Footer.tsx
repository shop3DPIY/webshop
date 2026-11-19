import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BusinessNavLink } from "./BusinessNavLink";
import { Logo } from "./Logo";
import { Container } from "@/components/ui/Container";
import { getBusinessDetails } from "@/lib/settings/business";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";

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
  // KvK and VAT come from Studio → Settings.
  const business = await getBusinessDetails();
  const tNewsletter = await getTranslations("newsletter");
  // Purple on the Shop, cyan on Serious Games — follows the track via
  // the --heading token (globals.css), so it stays right on client-side nav.
  const headingColor = "text-heading";

  return (
    <footer className="border-line bg-paper border-t shadow-xl backdrop-blur-lg">
      <Container className="grid gap-10 px-7 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="text-ink mt-3 text-sm">{t("tagline")}</p>
          {/* Anything wrong or missing: just mail. */}
          <p className="text-ink mt-3 text-sm">
            {t.rich("help", {
              email: business.contactEmail,
              mail: (chunks) => (
                <a
                  href={`mailto:${business.contactEmail}`}
                  className="text-ink font-semibold underline underline-offset-2"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>

        <div>
          <h2 className={`${headingColor} mb-3 text-sm font-semibold`}>
            {t("shopHeading")}
          </h2>
          <ul className="text-ink space-y-2 text-sm">
            <li>
              <Link href="/shop#all-designs">{t("shopAll")}</Link>
            </li>
            <li>
              <Link href="/free-designs">{t("shopFree")}</Link>
            </li>
            <li>
              <Link href="/requests">{t("shopRequests")}</Link>
            </li>
            <li>
              <Link href="/tools/3d-print-cost-calculator">{t("shopCalculator")}</Link>
            </li>
            <BusinessNavLink asListItem label={t("shopBusiness")} />
          </ul>
        </div>

        <div>
          <h2 className={`${headingColor} mb-3 text-sm font-semibold`}>
            {t("legalHeading")}
          </h2>
          <ul className="text-ink space-y-2 text-sm">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{t(link.key)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={`${headingColor} mb-3 text-sm font-semibold`}>
            {t("newsletterHeading")}
          </h2>
          <p className="text-ink mb-3 text-sm">{tNewsletter("description")}</p>
          <NewsletterSignup />
        </div>
      </Container>

      <Container className="border-line text-ink flex flex-col gap-2 border-t px-7 pt-6 pb-14 sm:pb-6 text-xs sm:flex-row sm:justify-between">
        <span>
          © {year} {t("copyright")}
        </span>
        {/* Only once real numbers are filled in (Studio → Settings). */}
        {!/x/i.test(business.kvk) && business.kvk && (
          <span>
            {t("kvk")} {business.kvk}
            {!/x{3}/i.test(business.vatId) && business.vatId && ` · ${t("vatId")} ${business.vatId}`}
          </span>
        )}
        <span>{t("digitalOnly")}</span>
      </Container>
    </footer>
  );
}
