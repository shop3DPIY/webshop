import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ProductCard } from "@/components/product/ProductCard";
import { FeedbackCta } from "@/components/product/FeedbackCta";
import { ACTIVE_COLLECTION_LIST } from "@/lib/config/colors";
import { TRACK_COOKIE, parseTrack } from "@/lib/config/track";
import { ProductBrowser } from "@/components/product/ProductBrowser";
import { collectionCounts, getPublishedProducts, newestFirst } from "@/lib/products";

export async function generateMetadata() {
  const t = await getTranslations("shopPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
  };
}

/**
 * The shop's start page: collections, the newest designs, then every
 * design with search and filters. Shows the visitor's track — the Shop
 * (from the chooser: ?track=dolls) or Business — and both before a
 * track has been picked.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; track?: string }>;
}) {
  const { q, track: trackParam } = await searchParams;
  const t = await getTranslations("shopPage");
  const tBrowser = await getTranslations("productBrowser");
  const tCollections = await getTranslations("collections.items");
  const cookieStore = await cookies();
  const track = parseTrack(trackParam) ?? parseTrack(cookieStore.get(TRACK_COOKIE)?.value);
  const collections = track
    ? ACTIVE_COLLECTION_LIST.filter((c) => c.track === track)
    : ACTIVE_COLLECTION_LIST;

  const slugs = new Set(collections.map((c) => c.slug));
  const products = (await getPublishedProducts()).filter((p) => slugs.has(p.category));
  const counts = collectionCounts(products);
  // Whole rows only (4 per row on desktop): no lone design on a second row.
  const newest = [...products].sort(newestFirst);
  const showNew = newest.slice(0, newest.length >= 8 ? 8 : newest.length >= 4 ? 4 : newest.length);

  return (
    <>
      <section className="py-8 sm:py-12">
        <Container panel className="flex flex-col gap-8 py-8 sm:py-10">
          <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
          <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.slug}
                slug={collection.slug}
                headingLevel="h2"
                count={counts[collection.slug] ?? 0}
              />
            ))}
          </div>
        </Container>
      </section>

      {showNew.length > 0 && (
        <section className="pb-8 sm:pb-12">
          <Container panel className="flex flex-col gap-8 py-8 sm:py-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow={t("newEyebrow")} title={t("newTitle")} />
              <a href="#all-designs" className="text-ink text-sm font-semibold underline underline-offset-2">
                {t("seeAll")} ↓
              </a>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {showNew.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i === 0} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section id="all-designs" className="scroll-mt-24 pb-16">
        <Container panel className="flex flex-col gap-8 py-8 sm:py-10">
          <h2 className="font-display text-ink text-2xl font-bold sm:text-3xl">{tBrowser("allTitle")}</h2>
          <ProductBrowser
            products={products}
            initialQuery={q?.slice(0, 100)}
            collections={collections.map((c) => ({ slug: c.slug, name: tCollections(`${c.slug}.name`) }))}
          />
          <div className="flex flex-col items-start gap-4 rounded-3xl p-6 glass sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-ink text-lg font-semibold">{t("freeTitle")}</h2>
              <p className="text-ink mt-1 text-sm">{t("freeBody")}</p>
            </div>
            <Button href="/free-designs" variant="secondary" className="shrink-0">
              {t("freeCta")}
            </Button>
          </div>
          <FeedbackCta />
        </Container>
      </section>
    </>
  );
}
