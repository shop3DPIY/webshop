import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Calculator } from "@/components/calculator/Calculator";

const PATH = "/tools/3d-print-cost-calculator";
const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
const FORGOTTEN_KEYS = ["waste", "failures", "machine", "design", "fees", "time", "overhead", "returns"] as const;

export async function generateMetadata() {
  const t = await getTranslations("calculatorPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: (await getLocale()) === "nl" ? `/nl${PATH}` : PATH,
      languages: { en: PATH, nl: `/nl${PATH}`, "x-default": PATH },
    },
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

/**
 * Public 3D print cost & price calculator — a free tool that brings
 * makers to 3DPIY via Google and AI search. Server-rendered explanation
 * and FAQ (with structured data) so search engines and AI assistants can
 * read and quote it; the full version lives in the account.
 */
export default async function CalculatorPage() {
  const t = await getTranslations("calculatorPage");
  const locale = await getLocale();
  const url = `https://3dpiy.com${locale === "nl" ? "/nl" : ""}${PATH}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: t("metaTitle"),
      url,
      description: t("metaDescription"),
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (web browser)",
      inLanguage: locale,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      publisher: { "@type": "Organization", name: "3DPIY", url: "https://3dpiy.com" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_KEYS.map((k) => ({
        "@type": "Question",
        name: t(`faq.${k}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`faq.${k}.a`) },
      })),
    },
  ];

  return (
    <Container panel className="flex flex-col gap-12 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("intro")} />

      <Calculator mode="simple" />

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-ink text-2xl font-semibold">{t("howTitle")}</h2>
          <p className="text-ink/75">{t("howBody")}</p>
          <p className="text-ink/75 rounded-2xl p-4 font-mono text-sm glass">{t("formula")}</p>
          <p className="text-ink/75">{t("howBody2")}</p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-ink text-2xl font-semibold">{t("forgottenTitle")}</h2>
          <ul className="text-ink/75 flex list-disc flex-col gap-2 pl-5">
            {FORGOTTEN_KEYS.map((k) => (
              <li key={k}>
                <strong className="text-ink">{t(`forgotten.${k}.title`)}:</strong> {t(`forgotten.${k}.body`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-ink text-2xl font-semibold">{t("faqTitle")}</h2>
        <div className="flex flex-col gap-3">
          {FAQ_KEYS.map((k) => (
            <details key={k} className="rounded-2xl p-4 glass">
              <summary className="text-ink cursor-pointer font-semibold">{t(`faq.${k}.q`)}</summary>
              <p className="text-ink/75 mt-2">{t(`faq.${k}.a`)}</p>
            </details>
          ))}
        </div>
      </section>
    </Container>
  );
}
