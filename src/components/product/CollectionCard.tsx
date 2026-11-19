import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { CollectionSlug } from "@/lib/config/colors";
import { COLLECTION_CLASSNAMES } from "@/lib/config/colors";
import { CollectionIcon } from "./CollectionIcon";

/**
 * A collection tile: icon in the collection colour, name, tagline and how
 * many designs it has ("Coming soon" when none yet). Compact on phones
 * (two per row), roomier from sm up.
 */
export function CollectionCard({
  slug,
  headingLevel: Heading = "h3",
  count,
}: {
  slug: CollectionSlug;
  /** "h3" when nested under a section heading; "h2" when the grid has no intervening heading (e.g. /shop). */
  headingLevel?: "h2" | "h3";
  /** Published designs in this collection (shown top right); omitted = no count */
  count?: number;
}) {
  const t = useTranslations(`collections.items.${slug}`);
  const tCard = useTranslations("collections");
  const classes = COLLECTION_CLASSNAMES[slug];

  return (
    <Link
      href={`/collections/${slug}`}
      className={`group flex flex-col justify-between gap-3 rounded-3xl border p-4 shadow-xl backdrop-blur-lg transition-colors sm:gap-6 sm:p-6 ${classes.border} ${classes.wash} ${classes.washHover}`}
    >
      {/* Icon left, number of designs top right — keeps the tiles low. */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white sm:h-10 sm:w-10 ${classes.bg}`}
        >
          <CollectionIcon slug={slug} className="h-5 w-5" />
        </span>
        {count !== undefined && (
          <span
            className="border-line shrink-0 rounded-full border bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap sm:px-2 sm:text-xs"
            title={count > 0 ? tCard("count", { count }) : tCard("comingSoon")}
          >
            {count > 0 ? (
              <>
                {/* Phones: just the number, the tile is narrow there. */}
                <span aria-hidden className="sm:hidden">{count}</span>
                <span className="sr-only sm:not-sr-only">{tCard("count", { count })}</span>
              </>
            ) : (
              tCard("comingSoon")
            )}
          </span>
        )}
      </div>
      <div>
        <Heading className="font-display text-ink text-base font-semibold sm:text-xl">
          {t("name")}
        </Heading>
        {/* Two lines tall from sm up, so titles line up across a row. */}
        <p className="text-ink mt-1 hidden min-h-10 text-sm sm:block">{t("tagline")}</p>
      </div>
    </Link>
  );
}
