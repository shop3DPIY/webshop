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
      className="group border-line hover:-translate-y-1 relative flex flex-col justify-between overflow-hidden rounded-3xl border p-6 transition-transform"
    >
      <div
        className={`absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100 ${classes.bgSoft}`}
      />
      <span
        className={`mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full ${classes.bg}`}
        aria-hidden
      />
      <div>
        <Heading className="font-display text-brand-purple text-xl font-semibold">
          {t("name")}
        </Heading>
        <p className="text-ink/70 mt-1 text-sm">{t("tagline")}</p>
      </div>
    </Link>
  );
}
