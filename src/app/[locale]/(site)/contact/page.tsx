import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/forms/ContactForm";
import { BUSINESS_DETAILS } from "@/lib/config/business";

const CONTACT_EMAIL = BUSINESS_DETAILS.contactEmail;

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const t = await getTranslations("contact");
  // Pre-filled by links like FeedbackCta ("something wrong or missing?").
  const { subject } = await searchParams;

  return (
    <Container panel className="flex flex-col gap-10 py-16 sm:py-24">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <div className="max-w-xl">
        <ContactForm defaultSubject={subject?.slice(0, 200)} />
        <p className="text-ink/60 mt-6 text-sm">
          {t("emailFallbackLabel")}{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-ink font-semibold underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </Container>
  );
}
