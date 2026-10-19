import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CollectionSlug } from "@/lib/config/colors";
import { COLLECTION_CLASSNAMES } from "@/lib/config/colors";

export function CollectionCard({
  slug,
  headingLevel: Heading = "h3",
}: {
  slug: CollectionSlug;
  /** "h3" when nested under a section heading (e.g. homepage); "h2" when the grid has no intervening heading (e.g. /shop). */
  headingLevel?: "h2" | "h3";
}) {
  const t = useTranslations(`collections.items.${slug}`);
  const classes = COLLECTION_CLASSNAMES[slug];

  return (
    <Link
      href={`/collections/${slug}`}
      className={`group flex flex-col justify-between gap-6 rounded-3xl border-2 p-6 shadow-xl backdrop-blur-lg transition-colors ${classes.border} ${classes.wash} ${classes.washHover}`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${classes.bg}`}
        aria-hidden
      />
      <div>
        <Heading className={`font-display text-xl font-semibold ${classes.text}`}>
          {t("name")}
        </Heading>
        <p className="text-ink/70 mt-1 text-sm">{t("tagline")}</p>
      </div>
    </Link>
  );
}
