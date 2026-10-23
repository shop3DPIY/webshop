import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ProductCard } from "@/components/product/ProductCard";
import { TrackMarker } from "@/components/system/TrackMarker";
import { getTrackCollections, getCollection } from "@/lib/config/colors";
import { getPublishedProducts } from "@/lib/products";

export default async function DollsPage() {
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
      {/* The page opens on the categories, centred in the first screen
          (viewport minus the h-20 header). */}
      <section className="relative flex min-h-[calc(100svh-5rem)] items-center py-8">
        <Container panel className="py-0 flex flex-col gap-10">
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
        {/* The categories fill the first screen, so hint that there's
            more below (New & popular, About). */}
        <a
          href="#new-and-popular"
          aria-label={tNewAndPopular("title")}
          className="border-line bg-mist text-ink hover:border-brand-purple hover:bg-brand-purple/45 absolute bottom-3 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border backdrop-blur-lg transition-colors hover:text-white motion-safe:animate-bounce"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            aria-hidden
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </a>
      </section>

      <section id="new-and-popular" className="scroll-mt-24 py-16 sm:py-24">
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
