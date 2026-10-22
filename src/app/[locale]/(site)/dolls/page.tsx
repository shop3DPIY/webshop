import { Quicksand } from "next/font/google";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ProductCard } from "@/components/product/ProductCard";
import { TrackMarker } from "@/components/system/TrackMarker";
import { getTrackCollections, getCollection } from "@/lib/config/colors";
import { getPublishedProducts } from "@/lib/products";

const quicksand = Quicksand({ subsets: ["latin"], weight: "700" });

export default async function DollsPage() {
  const tHero = await getTranslations("dollsLanding");
  const tCollections = await getTranslations("collections");
  const tNewAndPopular = await getTranslations("newAndPopular");
  const tAbout = await getTranslations("about");
  const tFreeDownloads = await getTranslations("freeDownloads");

  const collections = getTrackCollections("dolls");
  const allProducts = await getPublishedProducts();
  const products = allProducts.filter(
    (p) => getCollection(p.category).track === "dolls",
  );

  return (
    <>
      <TrackMarker track="dolls" />
      <section>
        <Container className="relative flex flex-col items-center py-20 text-center sm:py-28">
          <div className="flex max-w-4xl flex-col items-center gap-6 rounded-xl px-8 py-10 sm:px-12 glass">
            <span className="inline-flex rounded-full border border-line bg-mist px-4 py-1.5 text-sm font-medium text-ink">
              {tHero("eyebrow")}
            </span>
            <h1
              className={`${quicksand.className} text-4xl text-ink sm:whitespace-nowrap sm:text-5xl lg:text-6xl`}
            >
              {tHero("titleLine1")}{" "}
              <span className="text-ink">{tHero("titleLine2")}</span>
            </h1>
            <p className="max-w-xl text-lg text-ink/80">
              {tHero("description")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button href="/shop" size="lg">
                {tHero("cta")}
              </Button>
              <Button href="/free-designs" variant="secondary" size="lg">
                {tFreeDownloads("cta")}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container panel className="flex flex-col gap-10">
          <SectionHeading
            eyebrow={tCollections("eyebrow")}
            title={tCollections("title")}
            description={tCollections("description")}
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
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container panel className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow={tAbout("eyebrow")}
              title={tAbout("title")}
            />
            <p className="text-ink/70 mt-4 text-base sm:text-lg">
              {tAbout("description")}
            </p>
          </div>
          <div className="rounded-3xl p-8 glass">
            <h3 className="font-display text-ink text-lg font-semibold">
              {tFreeDownloads("title")}
            </h3>
            <p className="text-ink/70 mt-2 text-sm">
              {tFreeDownloads("description")}
            </p>
            <Button href="/free-designs" className="mt-4">
              {tFreeDownloads("cta")}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
