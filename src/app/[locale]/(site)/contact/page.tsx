import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/forms/ContactForm";

const CONTACT_EMAIL = "hello@3dpiy.com";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <Container className="flex flex-col gap-10 py-16 sm:py-24">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <div className="max-w-xl">
        <ContactForm />
        <p className="text-ink/60 mt-6 text-sm">
          {t("emailFallbackLabel")}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink font-semibold underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </Container>
  );
}
