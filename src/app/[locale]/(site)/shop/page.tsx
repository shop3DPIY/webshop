import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ACTIVE_COLLECTION_LIST } from "@/lib/config/colors";
import { TRACK_COOKIE, parseTrack } from "@/lib/config/track";
import { ProductBrowser } from "@/components/product/ProductBrowser";
import { getPublishedProducts } from "@/lib/products";

export async function generateMetadata() {
  const t = await getTranslations("shopPage");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations("shopPage");
  const tBrowser = await getTranslations("productBrowser");
  const tCollections = await getTranslations("collections.items");
  const cookieStore = await cookies();
  const track = parseTrack(cookieStore.get(TRACK_COOKIE)?.value);
  // Each track gets its own shop: once a visitor has picked Dolls or
  // Business (see src/proxy.ts), this only shows that track's
  // collections instead of mixing both — same cookie Header/Footer use.
  const collections = track
    ? ACTIVE_COLLECTION_LIST.filter((c) => c.track === track)
    : ACTIVE_COLLECTION_LIST;

  const slugs = new Set(collections.map((c) => c.slug));
  const products = (await getPublishedProducts()).filter((p) =>
    slugs.has(p.category),
  );

  // Collections first (centred in the first screen, viewport minus the
  // h-20 header), then every design with search and filters.
  return (
    <>
    <section className="flex min-h-[calc(100svh-5rem)] items-center py-8">
      <Container panel className="py-0 flex flex-col gap-10">
        <SectionHeading
          as="h1"
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
        <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.slug}
              slug={collection.slug}
              headingLevel="h2"
            />
          ))}
        </div>
      </Container>
    </section>
    <section id="all-designs" className="scroll-mt-24">
      <Container panel className="flex flex-col gap-8 pt-0 pb-16">
        <h2 className="font-display text-ink text-2xl font-bold sm:text-3xl">
          {tBrowser("allTitle")}
        </h2>
        <ProductBrowser
          products={products}
          initialQuery={q?.slice(0, 100)}
          collections={collections.map((c) => ({
            slug: c.slug,
            name: tCollections(`${c.slug}.name`),
          }))}
        />
      </Container>
    </section>
    </>
  );
}
