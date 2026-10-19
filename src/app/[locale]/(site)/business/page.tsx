import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { TRACK_COOKIE } from "@/lib/config/track";

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
  const cookieStore = await cookies();
  const isDolls = cookieStore.get(TRACK_COOKIE)?.value === "dolls";

  // Commercial licensing only exists for Serious Games today (that track's
  // whole premise is commercial resale, see the licenseNote banner on its
  // landing page) — Dolls gets a placeholder until that's built out.
  if (isDolls) {
    return (
      <Container className="flex flex-col items-start gap-4 py-16 text-left sm:py-24">
        <SectionHeading
          as="h1"
          eyebrow={t("dollsComingSoonEyebrow")}
          title={t("dollsComingSoonTitle")}
          description={t("dollsComingSoonBody")}
        />
        <Button href="/contact" size="lg">{t("cta")}</Button>
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-12 py-16 sm:py-24">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("intro")} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="border-line rounded-3xl border p-8">
          <h2 className="font-display text-brand-purple text-xl font-semibold">
            {t("licensingTitle")}
          </h2>
          <p className="text-ink/70 mt-3 text-sm sm:text-base">{t("licensingBody")}</p>
        </div>

        <div className="border-line rounded-3xl border p-8">
          <h2 className="font-display text-brand-purple text-xl font-semibold">
            {t("commissionsTitle")}
          </h2>
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
