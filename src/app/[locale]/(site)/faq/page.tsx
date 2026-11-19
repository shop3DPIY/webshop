import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LegalBody } from "@/components/legal/LegalBody";
import { FAQ_DOCS, faqItems } from "@/content/legal";
import { TRACK_COOKIE, parseTrack } from "@/lib/config/track";
import { getLegalText } from "@/lib/settings/legal";

export async function generateMetadata() {
  const t = await getTranslations("faqPage");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * FAQ for the Shop and for Business (texts from Studio → Texts). The
 * visitor's own track comes first. FAQPage data for Google and AI search.
 */
export default async function FaqPage() {
  const t = await getTranslations("faqPage");
  const locale = await getLocale();
  const track = parseTrack((await cookies()).get(TRACK_COOKIE)?.value);
  const order = track === "business" ? [...FAQ_DOCS].reverse() : [...FAQ_DOCS];
  const sections = await Promise.all(
    order.map(async (doc) => {
      const text = await getLegalText(doc, locale);
      return { doc, title: text.title, items: faqItems(text.body) };
    }),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((s) =>
      s.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        // Plain text for search engines: links and bold markers removed.
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
        },
      })),
    ),
  };

  return (
    <Container panel className="flex flex-col gap-10 py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("intro")} />
      {sections.map((section) => (
        <section key={section.doc} className="flex flex-col gap-3" aria-labelledby={section.doc}>
          <h2 id={section.doc} className="font-display text-ink text-2xl font-semibold">
            {section.doc === "faq-shop" ? t("shop") : t("business")}
          </h2>
          {section.items.map((item) => (
            <details key={item.q} className="group rounded-2xl p-4 glass sm:p-5">
              <summary className="text-ink flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.q}
                <span aria-hidden className="shrink-0 transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3">
                <LegalBody text={item.a} />
              </div>
            </details>
          ))}
        </section>
      ))}
    </Container>
  );
}
