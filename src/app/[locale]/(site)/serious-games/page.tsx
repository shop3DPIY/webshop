import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ProductCard } from "@/components/product/ProductCard";
import { TrackMarker } from "@/components/system/TrackMarker";
import { getTrackCollections, getCollection } from "@/lib/config/colors";
import { getPublishedProducts } from "@/lib/products";

/**
 * Deliberately not styled like /dolls — this is the B2B track (commercial
 * resale license, not a hobby purchase), so the vibe is sober/structured
 * instead of playful: a solid dark gradient instead of the pastel banner,
 * no glassmorphism, and an explicit licensing callout up front.
 */
export default async function SeriousGamesPage() {
  const tHero = await getTranslations("seriousGamesLanding");
  const tCollections = await getTranslations("collections");
  const tNewAndPopular = await getTranslations("newAndPopular");

  const collections = getTrackCollections("serious-games");
  const allProducts = await getPublishedProducts();
  const products = allProducts.filter(
    (p) => getCollection(p.category).track === "serious-games",
  );

  return (
    <>
      <TrackMarker track="serious-games" />
      <section>
        <Container className="py-20 sm:py-28">
          <div className="glass flex flex-col items-start gap-6 rounded-xl px-8 py-10 text-left sm:px-12">
            <span className="border-brand-purple bg-brand-purple/15 inline-flex rounded-full border backdrop-blur-lg px-4 py-1.5 text-sm font-medium text-ink">
              {tHero("eyebrow")}
            </span>
            <h1 className="font-display max-w-2xl text-4xl font-bold text-ink sm:text-5xl">
              {tHero("titleLine1")}{" "}
              <span className="text-brand-purple">{tHero("titleLine2")}</span>
            </h1>
            <p className="max-w-xl text-lg text-ink/70">
              {tHero("description")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button href="/shop" variant="primaryAlt" size="lg">
                {tHero("cta")}
              </Button>
              <Button href="/contact" variant="secondaryAlt" size="lg">
                {tHero("contactSalesCta")}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="flex flex-col gap-2 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between glass">
            <p className="text-ink text-sm font-medium sm:text-base">
              {tHero("licenseNote")}
            </p>
            <Button href="/contact" className="shrink-0">
              {tHero("contactSalesCta")} →
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container panel className="flex flex-col gap-10">
          <SectionHeading
            eyebrow={tCollections("eyebrow")}
            title={tCollections("title")}
            description={tCollections("description")}
            tone="purple"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.slug} slug={collection.slug} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container panel className="flex flex-col gap-10">
          <SectionHeading
            eyebrow={tNewAndPopular("eyebrow")}
            title={tNewAndPopular("title")}
            description={tNewAndPopular("description")}
            tone="purple"
          />
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl p-12 text-center glass">
              <p className="text-ink/60 text-sm">{tHero("emptyCatalogNote")}</p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
