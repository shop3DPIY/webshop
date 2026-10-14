import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export async function generateMetadata() {
  const t = await getTranslations("business");
  return {
    title: t("title"),
    description: t("intro"),
  };
}

export default async function BusinessPage() {
  const t = await getTranslations("business");
  const bullets = t.raw("commissionsBullets") as string[];

  return (
    <Container className="flex flex-col gap-12 py-16 sm:py-24">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("intro")} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="border-line rounded-3xl border p-8">
          <h2 className="font-display text-xl font-semibold">{t("licensingTitle")}</h2>
          <p className="text-ink/70 mt-3 text-sm sm:text-base">{t("licensingBody")}</p>
        </div>

        <div className="border-line rounded-3xl border p-8">
          <h2 className="font-display text-xl font-semibold">{t("commissionsTitle")}</h2>
          <p className="text-ink/70 mt-3 text-sm sm:text-base">{t("commissionsBody")}</p>
          <ul className="text-ink/70 mt-4 space-y-2 text-sm">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="text-accent" aria-hidden>•</span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3">
        <Button href="/contact" size="lg">{t("cta")}</Button>
        <p className="text-ink/60 text-xs">{t("legalNotice")}</p>
      </div>
    </Container>
  );
}
