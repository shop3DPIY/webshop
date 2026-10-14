import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ProductCard } from "@/components/product/ProductCard";
import { COLLECTION_LIST } from "@/lib/config/colors";
import { getPublishedProducts } from "@/lib/products";

export default async function Home() {
  const tHero = await getTranslations("hero");
  const tCollections = await getTranslations("collections");
  const tNewAndPopular = await getTranslations("newAndPopular");
  const tAbout = await getTranslations("about");
  const tFreeDownloads = await getTranslations("freeDownloads");
  const products = await getPublishedProducts();

  return (
    <>
      <section className="bg-mist relative overflow-hidden">
        <div
          className="bg-doll-mini absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
          aria-hidden
        />
        <div
          className="bg-tech-electronics absolute top-10 -right-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          aria-hidden
        />
        <div
          className="bg-ikea-hacks absolute bottom-[-6rem] left-1/3 h-64 w-64 rounded-full opacity-20 blur-3xl"
          aria-hidden
        />

        <Container className="relative flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <span className="border-line bg-paper inline-flex rounded-full border px-4 py-1.5 text-sm font-medium">
            {tHero("eyebrow")}
          </span>
          <h1 className="font-display max-w-3xl text-4xl font-bold sm:text-6xl">
            {tHero("titleLine1")} <span className="text-accent">{tHero("titleLine2")}</span>
          </h1>
          <p className="text-ink/70 max-w-xl text-lg">{tHero("description")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button href="/shop" size="lg">{tHero("ctaShop")}</Button>
            <Button href="/free-designs" variant="secondary" size="lg">
              {tHero("ctaFree")}
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
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTION_LIST.map((collection) => (
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
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow={tAbout("eyebrow")} title={tAbout("title")} />
            <p className="text-ink/70 mt-4 text-base sm:text-lg">
              {tAbout("description")}
            </p>
          </div>
          <div className="border-line bg-mist rounded-3xl border p-8">
            <h3 className="font-display text-lg font-semibold">
              {tFreeDownloads("title")}
            </h3>
            <p className="text-ink/70 mt-2 text-sm">{tFreeDownloads("description")}</p>
            <Button href="/free-designs" variant="secondary" className="mt-4">
              {tFreeDownloads("cta")}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
