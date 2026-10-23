import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

/**
 * "Something wrong or missing?" — shown under the models (Shop landing,
 * collection pages, product page). Links to the contact form with the
 * subject already filled in; on a product page it names that product.
 * When the dedicated request form exists, only the href changes here.
 */
export async function FeedbackCta({ productTitle }: { productTitle?: string }) {
  const t = await getTranslations("feedbackCta");
  const subject = productTitle ? t("subjectProduct", { title: productTitle }) : t("subject");

  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl p-6 glass sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-ink text-lg font-semibold">{t("title")}</h2>
        <p className="text-ink/70 mt-1 text-sm">{t("body")}</p>
      </div>
      <Button
        href={`/contact?subject=${encodeURIComponent(subject)}`}
        variant="secondary"
        className="shrink-0"
      >
        {t("cta")}
      </Button>
    </div>
  );
}
