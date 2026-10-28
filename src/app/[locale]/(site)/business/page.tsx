import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ProductCard } from "@/components/product/ProductCard";
import { TrackMarker } from "@/components/system/TrackMarker";
import { getTrackCollections, getCollection } from "@/lib/config/colors";
import { getPublishedProducts } from "@/lib/products";

export async function generateMetadata() {
  const t = await getTranslations("businessLanding");
  return { title: t("eyebrow"), description: t("description") };
}

/**
 * 3DPIY Business — the B2B track's landing page. Every collection whose
 * `track` is "business" (src/lib/config/colors.ts) shows up here and sells
 * commercial licenses (Startup / Studio) next to the personal one — see
 * sellableTiers. Serious Games is the first; another collection joins by
 * switching its track.
 *
 * Deliberately not styled like /dolls: sober and structured instead of
 * playful, with the licenses explained up front.
 */
export default async function BusinessPage() {
  const tHero = await getTranslations("businessLanding");
  const tBusiness = await getTranslations("business");
  const tCollections = await getTranslations("collections");
  const tNewAndPopular = await getTranslations("newAndPopular");
  const bullets = tBusiness.raw("commissionsBullets") as string[];

  const collections = getTrackCollections("business");
  const allProducts = await getPublishedProducts();
  const products = allProducts.filter(
    (p) => getCollection(p.category).track === "business",
  );

  const licenses = [
    { title: tHero("personalTitle"), body: tHero("personalBody") },
    { title: tHero("startupTitle"), body: tHero("startupBody") },
    { title: tHero("studioTitle"), body: tHero("studioBody") },
  ];

  return (
    <>
      <TrackMarker track="business" />
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
        <Container panel className="flex flex-col gap-8">
          <SectionHeading
            title={tHero("licensesTitle")}
            description={tHero("licensesIntro")}
            tone="purple"
          />
          <div className="grid auto-rows-fr gap-5 sm:grid-cols-3">
            {licenses.map((license) => (
              <div key={license.title} className="rounded-3xl p-6 glass">
                <h3 className="font-display text-ink text-lg font-semibold">
                  {license.title}
                </h3>
                <p className="text-ink/70 mt-2 text-sm">{license.body}</p>
              </div>
            ))}
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
          <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      <section className="py-16 sm:py-24">
        <Container panel className="flex flex-col gap-6">
          <SectionHeading
            title={tBusiness("commissionsTitle")}
            description={tBusiness("commissionsBody")}
            tone="purple"
          />
          <ul className="text-ink/70 space-y-2 text-sm">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="text-heading" aria-hidden>
                  •
                </span>
                {bullet}
              </li>
            ))}
          </ul>
          <div>
            <Button href="/contact" size="lg">
              {tBusiness("cta")}
            </Button>
          </div>
          <p className="text-ink/60 text-xs">{tBusiness("legalNotice")}</p>
        </Container>
      </section>
    </>
  );
}
