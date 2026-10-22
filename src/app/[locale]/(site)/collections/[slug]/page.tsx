import { TrackMarker } from "@/components/system/TrackMarker";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { Link } from "@/i18n/navigation";
import {
  COLLECTION_LIST,
  COLLECTION_CLASSNAMES,
  COLLECTIONS,
  type CollectionSlug,
} from "@/lib/config/colors";
import { getProductsByCategory } from "@/lib/products";

export function generateStaticParams() {
  return COLLECTION_LIST.map((collection) => ({ slug: collection.slug }));
}

function isCollectionSlug(slug: string): slug is CollectionSlug {
  return slug in COLLECTIONS;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isCollectionSlug(slug)) return {};
  const t = await getTranslations(`collections.items.${slug}`);
  return {
    title: t("name"),
    description: t("tagline"),
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isCollectionSlug(slug)) notFound();

  const t = await getTranslations(`collections.items.${slug}`);
  const tPage = await getTranslations("collectionPage");
  const classes = COLLECTION_CLASSNAMES[slug];
  const products = await getProductsByCategory(slug);

  return (
    <>
      <TrackMarker track={COLLECTIONS[slug].track} />
      <section>
        <Container className="pt-16 sm:pt-20">
          <div
            className={`glass flex flex-col gap-4 rounded-3xl px-8 py-10 sm:px-12 ${classes.border}`}
          >
            <Link
              href="/shop"
              className="text-ink hover:text-ink/70 text-sm font-medium"
            >
              ← {tPage("backToShop")}
            </Link>
            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${classes.bg}`}
              aria-hidden
            />
            <h1
              className={`font-display text-ink text-3xl font-bold sm:text-5xl`}
            >
              {t("name")}
            </h1>
            <p className="text-ink/70 max-w-xl text-lg">{t("tagline")}</p>
          </div>
        </Container>
      </section>

      <Container panel className="py-16 sm:py-24">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-12 text-center glass">
            <h2 className="font-display text-ink text-xl font-semibold">
              {tPage("emptyTitle")}
            </h2>
            <p className="text-ink/60 mt-2 text-sm">
              {tPage("emptyDescription")}
            </p>
          </div>
        )}
      </Container>
    </>
  );
}
