import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/forms/ContactForm";
import { BUSINESS_DETAILS } from "@/lib/config/business";
import { isMailConfigured } from "@/lib/mail/send";

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

  // Two columns on wide screens — intro + direct email on the left, the
  // form on its own glass card on the right; stacked on phones.
  // Centred in the first screen (viewport minus the h-20 header), like the
  // Shop pages.
  return (
    <section className="flex min-h-[calc(100svh-5rem)] items-center py-8">
      <Container
        panel
        className="py-0 grid grid-cols-1 gap-10 lg:grid-cols-[2fr_3fr] lg:items-start lg:gap-14"
      >
        <div className="flex min-w-0 flex-col gap-6">
          <SectionHeading
            as="h1"
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
          <p className="text-ink/70 text-sm">
            {t("emailFallbackLabel")}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-ink font-semibold underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div className="min-w-0 rounded-3xl p-5 glass sm:p-8">
          <ContactForm
            defaultSubject={subject?.slice(0, 200)}
            mailConfigured={isMailConfigured()}
          />
        </div>
      </Container>
    </section>
  );
}
