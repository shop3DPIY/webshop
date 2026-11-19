import { TrackMarker } from "@/components/system/TrackMarker";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CollectionIcon } from "@/components/product/CollectionIcon";
import { ProductCard } from "@/components/product/ProductCard";
import { LegalBody } from "@/components/legal/LegalBody";
import { getLegalText } from "@/lib/settings/legal";
import { Container } from "@/components/ui/Container";
import { ProductBrowser } from "@/components/product/ProductBrowser";
import { FeedbackCta } from "@/components/product/FeedbackCta";
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
  // First what belongs here, then what's also ticked for this collection.
  const own = products.filter((p) => p.category === slug);
  // The collection text (Studio → Texts), under the designs.
  const collectionText = await getLegalText(`col-${slug}`, await getLocale());
  const alsoHere = products.filter((p) => p.category !== slug);

  return (
    <>
      <TrackMarker track={COLLECTIONS[slug].track} />
      <section>
        <Container className="pt-16 sm:pt-20">
          <div
            className={`glass flex flex-col gap-4 rounded-xl px-8 py-10 sm:px-12 ${classes.border}`}
          >
            <Breadcrumbs
              locale={await getLocale()}
              items={[{ label: tPage("shop"), href: "/shop" }, { label: t("name") }]}
            />
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-white ${classes.bg}`}>
              <CollectionIcon slug={slug} className="h-6 w-6" />
            </span>
            <h1
              className={`font-display text-ink text-3xl font-bold sm:text-5xl`}
            >
              {t("name")}
            </h1>
            <p className="text-ink max-w-xl text-lg">{t("tagline")}</p>
          </div>
        </Container>
      </section>

      <Container panel className="flex flex-col gap-8 py-16 sm:py-24">
        {own.length > 0 ? (
          <>
            {/* For screen readers and heading order: the cards are h3s. */}
            <h2 className="sr-only">{tPage("designsHeading")}</h2>
            <ProductBrowser
              products={own}
              scales={
                slug === "doll-mini"
                  ? [
                      { value: "1:6", label: tPage("scaleBarbie") },
                      { value: "1:12", label: tPage("scaleDollhouse") },
                    ]
                  : undefined
              }
            />
          </>
        ) : (
          <div className="rounded-3xl p-12 text-center glass">
            <h2 className="font-display text-ink text-xl font-semibold">
              {tPage("emptyTitle")}
            </h2>
            <p className="text-ink mt-2 text-sm">
              {tPage("emptyDescription")}
            </p>
          </div>
        )}

        {/* Designs from other collections that are also ticked for this one. */}
        {alsoHere.length > 0 && (
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-ink text-2xl font-semibold">
              {tPage("alsoHere", { name: t("name") })}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {alsoHere.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {collectionText.body && (
          <section className="border-line max-w-3xl border-t pt-8">
            <LegalBody text={collectionText.body} />
          </section>
        )}

        <FeedbackCta />
      </Container>
    </>
  );
}
