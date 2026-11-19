import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

/**
 * "Something wrong or missing?" — shown under the models (Shop landing,
 * collection pages, product page). Opens the request form (/requests);
 * on a product page it's about that product.
 */
export async function FeedbackCta({ productSlug }: { productSlug?: string }) {
  const t = await getTranslations("feedbackCta");
  const href = productSlug
    ? `/requests?product=${encodeURIComponent(productSlug)}`
    : "/requests";

  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl p-6 glass sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-ink text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="text-ink mt-1 text-sm">{t("body")}</p>
      </div>
      <Button href={href} variant="secondary" className="shrink-0">
        {t("cta")}
      </Button>
    </div>
  );
}
