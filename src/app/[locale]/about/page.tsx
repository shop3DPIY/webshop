import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export async function generateMetadata() {
  const t = await getTranslations("aboutPage");
  return {
    title: t("title"),
    description: t("introBody"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("aboutPage");
  const values = t.raw("values") as string[];

  return (
    <Container className="flex flex-col gap-14 py-16 sm:py-24">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} />

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-brand-purple text-xl font-semibold">
            {t("introTitle")}
          </h2>
          <p className="text-ink/70 mt-3 text-base sm:text-lg">{t("introBody")}</p>
        </div>
        <div>
          <h2 className="font-display text-brand-purple text-xl font-semibold">
            {t("makerTitle")}
          </h2>
          <p className="text-ink/70 mt-3 text-base sm:text-lg">{t("makerBody")}</p>
        </div>
      </div>

      <div className="bg-brand-pink/5 rounded-3xl p-8 sm:p-10">
        <h2 className="font-display text-brand-purple text-xl font-semibold">
          {t("valuesTitle")}
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          {values.map((value) => (
            <li key={value} className="border-line bg-paper rounded-2xl border p-5 text-sm">
              {value}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Button href="/contact" size="lg">{t("cta")}</Button>
      </div>
    </Container>
  );
}
