import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ProductCard } from "@/components/product/ProductCard";
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
      <section className="bg-gradient-to-br from-[#140b29] via-[#2a1b55] to-[#8c52ff]">
        <Container className="flex flex-col items-start gap-6 py-20 text-left sm:py-28">
          <span className="border-brand-periwinkle/40 bg-white/10 inline-flex rounded-full border px-4 py-1.5 text-sm font-medium text-white">
            {tHero("eyebrow")}
          </span>
          <h1 className="font-display max-w-2xl text-4xl font-bold text-white sm:text-5xl">
            {tHero("titleLine1")} <span className="text-brand-cyan">{tHero("titleLine2")}</span>
          </h1>
          <p className="max-w-xl text-lg text-white/70">{tHero("description")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/shop" variant="primaryAlt" size="lg">{tHero("cta")}</Button>
            <Button href="/contact" variant="secondaryAlt" size="lg">
              {tHero("contactSalesCta")}
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="border-brand-purple/30 bg-brand-purple/5 flex flex-col gap-2 rounded-3xl border p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink text-sm font-medium sm:text-base">{tHero("licenseNote")}</p>
            <Button href="/contact" variant="ghost">
              {tHero("contactSalesCta")} →
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="flex flex-col gap-10">
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

      <section className="bg-mist py-16 sm:py-24">
        <Container className="flex flex-col gap-10">
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
            <div className="border-line rounded-3xl border border-dashed p-12 text-center">
              <p className="text-ink/60 text-sm">{tHero("emptyCatalogNote")}</p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
