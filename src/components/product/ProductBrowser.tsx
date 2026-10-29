"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ProductCard } from "./ProductCard";
import { COLLECTION_CLASSNAMES, type CollectionSlug } from "@/lib/config/colors";
import { productText, type Product } from "@/types/product";

type PriceFilter = "all" | "free" | "under5" | "5to10" | "over10";
type Sort = "newest" | "priceAsc" | "priceDesc" | "name";

const FIELD =
  "border-line bg-paper rounded-full border px-4 py-2.5 text-sm text-ink";

/**
 * Search + filters over a list of products, all in the browser (the
 * catalog is small, so no round trips). Search looks at titles and
 * descriptions in both languages, tags, the collection name and the
 * "compatible with" items (e.g. an IKEA product name).
 *
 * `collections` shows the collection filter (the Shop's all-designs
 * list); leave it out on a collection page.
 */
export function ProductBrowser({
  products,
  collections,
  initialQuery = "",
}: {
  products: Product[];
  /** From ?q= (e.g. a tag clicked on a product page) */
  initialQuery?: string;
  collections?: { slug: CollectionSlug; name: string }[];
}) {
  const t = useTranslations("productBrowser");
  const tCollections = useTranslations("collections.items");
  const locale = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [collection, setCollection] = useState<CollectionSlug | "all">("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const haystacks = useMemo(
    () =>
      new Map(
        products.map((p) => [
          p.id,
          [
            p.title,
            p.titleNl,
            p.description,
            p.descriptionNl,
            ...p.tags,
            tCollections(`${p.category}.name`),
            ...(p.externalLinks?.compatible ?? []).map((c) => c.label),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        ]),
      ),
    [products, tCollections],
  );

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const cents = (p: Product) => (p.isFree ? 0 : (p.priceCents ?? 0));
    return products
      .filter((p) => words.every((w) => haystacks.get(p.id)!.includes(w)))
      .filter(
        (p) =>
          collection === "all" ||
          p.category === collection ||
          p.extraCategories?.includes(collection),
      )
      .filter((p) => {
        const c = cents(p);
        switch (price) {
          case "free":
            return p.isFree;
          case "under5":
            return !p.isFree && c < 500;
          case "5to10":
            return c >= 500 && c <= 1000;
          case "over10":
            return c > 1000;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (sort === "priceAsc") return cents(a) - cents(b);
        if (sort === "priceDesc") return cents(b) - cents(a);
        if (sort === "name") {
          return productText(a, locale).title.localeCompare(
            productText(b, locale).title,
          );
        }
        return b.lastUpdated.localeCompare(a.lastUpdated);
      });
  }, [products, haystacks, query, collection, price, sort, locale]);

  const filtered = query || collection !== "all" || price !== "all";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="min-w-60 flex-1">
            <span className="sr-only">{t("search")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className={`${FIELD} w-full`}
            />
          </label>
          <label>
            <span className="sr-only">{t("price")}</span>
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value as PriceFilter)}
              className={FIELD}
            >
              <option value="all">{t("priceAll")}</option>
              <option value="free">{t("priceFree")}</option>
              <option value="under5">{t("priceUnder5")}</option>
              <option value="5to10">{t("price5to10")}</option>
              <option value="over10">{t("priceOver10")}</option>
            </select>
          </label>
          <label>
            <span className="sr-only">{t("sort")}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className={FIELD}
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="priceAsc">{t("sortPriceAsc")}</option>
              <option value="priceDesc">{t("sortPriceDesc")}</option>
              <option value="name">{t("sortName")}</option>
            </select>
          </label>
        </div>

        {collections && collections.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCollection("all")}
              aria-pressed={collection === "all"}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                collection === "all"
                  ? "border-white bg-white/40"
                  : "border-line hover:bg-mist"
              }`}
            >
              {t("allCollections")}
            </button>
            {collections.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCollection(c.slug)}
                aria-pressed={collection === c.slug}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  COLLECTION_CLASSNAMES[c.slug].border
                } ${collection === c.slug ? "bg-white/40" : "hover:bg-mist"}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${COLLECTION_CLASSNAMES[c.slug].bg}`}
                  aria-hidden
                />
                {c.name}
              </button>
            ))}
          </div>
        )}

        <p className="text-ink/60 text-xs" aria-live="polite">
          {t("count", { count: shown.length })}
          {filtered && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCollection("all");
                  setPrice("all");
                }}
                className="underline underline-offset-2"
              >
                {t("clear")}
              </button>
            </>
          )}
        </p>
      </div>

      {shown.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl p-12 text-center glass">
          <p className="font-display text-ink text-lg font-semibold">
            {products.length === 0 ? t("emptyCatalog") : t("noResults")}
          </p>
        </div>
      )}
    </div>
  );
}
