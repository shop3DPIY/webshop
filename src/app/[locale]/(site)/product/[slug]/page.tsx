import { notFound } from "next/navigation";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SpecList } from "@/components/product/SpecList";
import { ProductCard } from "@/components/product/ProductCard";
import { FeedbackCta } from "@/components/product/FeedbackCta";
import { Link } from "@/i18n/navigation";
import { TrackMarker } from "@/components/system/TrackMarker";
import { COLLECTION_CLASSNAMES, getCollection } from "@/lib/config/colors";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/products";
import { commerceProvider, isListed } from "@/lib/commerce";
import { FreeDownloadForm } from "@/components/product/FreeDownloadForm";
import { productText } from "@/types/product";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const text = productText(product, await getLocale());
  return {
    title: text.title,
    description: text.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("productPage");
  const text = productText(product, await getLocale());
  const tSpecs = await getTranslations("productPage.specs");
  const tBuy = await getTranslations("productPage.buy");
  const tLicense = await getTranslations("licenseTypes");
  const collection = getCollection(product.category);
  const classes = COLLECTION_CLASSNAMES[product.category];
  const cover = product.images[0];
  const related = await getRelatedProducts(product);
  const checkout = commerceProvider.getCheckoutLink(product);

  const specRows = [
    product.dimensions && {
      label: tSpecs("dimensions"),
      value: `${product.dimensions.width} × ${product.dimensions.depth} × ${product.dimensions.height} mm`,
    },
    product.downloadFiles.length > 0 && {
      label: tSpecs("downloadFiles"),
      value: [...new Set(product.downloadFiles.map((f) => f.format))].join(
        ", ",
      ),
    },
    product.printSettings?.layerHeightMm && {
      label: tSpecs("layerHeight"),
      value: `${product.printSettings.layerHeightMm} mm`,
    },
    product.printSettings?.recommendedMaterials?.length && {
      label: tSpecs("recommendedMaterials"),
      value: product.printSettings.recommendedMaterials.join(", "),
    },
    product.printSettings?.supportsRequired !== undefined && {
      label: tSpecs("supportsRequired"),
      value: product.printSettings.supportsRequired
        ? tSpecs("supportYes")
        : tSpecs("supportNo"),
    },
    product.printSettings?.compatiblePrinters?.length && {
      label: tSpecs("compatiblePrinters"),
      value: product.printSettings.compatiblePrinters.join(", "),
    },
    {
      label: tSpecs("license"),
      value: tLicense(product.licenseType),
    },
    {
      label: tSpecs("version"),
      value: product.version,
    },
    {
      label: tSpecs("lastUpdated"),
      value: product.lastUpdated,
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: text.title,
    description: text.description,
    sku: product.slug,
    category: collection.name,
    ...(cover && { image: `https://3dpiy.com${cover.src}` }),
    ...(checkout.mode === "redirect" &&
      checkout.url && {
        offers: {
          "@type": "Offer",
          url: checkout.url,
          availability: "https://schema.org/InStock",
          ...(product.isFree && { price: "0", priceCurrency: "EUR" }),
        },
      }),
  };

  return (
    <Container panel className="flex flex-col gap-12 py-12 sm:py-16">
      <TrackMarker track={collection.track} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href={`/collections/${product.category}`}
        className="text-ink/60 hover:text-ink text-sm font-medium"
      >
        ← {t("backToCollection")}
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div
            className={`glass relative aspect-square overflow-hidden rounded-3xl ${classes.border} ${classes.wash}`}
          >
            {cover && (
              <Image
                src={cover.src}
                alt={cover.alt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
            )}
            <Badge className="bg-white/90 text-night border-white absolute top-4 left-4 gap-1.5 border">
              <span
                className={`h-2 w-2 rounded-full ${classes.bg}`}
                aria-hidden
              />
              {collection.name}
            </Badge>
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1).map((image) => (
                <a
                  key={image.src}
                  href={image.src}
                  target="_blank"
                  rel="noopener"
                  className={`glass relative aspect-square overflow-hidden rounded-2xl ${classes.border}`}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </a>
              ))}
            </div>
          )}

          {product.timelapseUrl && (
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-ink text-lg font-semibold">
                {t("timelapse")}
              </h2>
              <video
                src={product.timelapseUrl}
                controls
                muted
                loop
                playsInline
                preload="metadata"
                className={`glass w-full rounded-3xl ${classes.border}`}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-display text-ink text-3xl font-bold sm:text-4xl">
              {text.title}
            </h1>
            <p className="text-ink/70 mt-3 text-base sm:text-lg">
              {text.description}
            </p>
          </div>

          {product.printSettings?.instructions && (
            <p className="text-ink/70 text-sm">
              {product.printSettings.instructions}
            </p>
          )}

          <div className="rounded-3xl p-6 glass">
            {product.isFree ? (
              <FreeDownloadForm productId={product.id} />
            ) : checkout.mode === "redirect" && checkout.url ? (
              <Button href={checkout.url} size="lg" className="w-full">
                {product.isFree ? tBuy("getFree") : tBuy("buyNow")}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled
                >
                  {tBuy("comingSoon")}
                </Button>
                <p className="text-ink/60 mt-3 text-xs">
                  {isListed(product)
                    ? tBuy("comingSoonNote")
                    : tBuy("notListedNote")}
                </p>
              </>
            )}
          </div>

          <SpecList rows={specRows} />
        </div>
      </div>

      {related.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-ink text-2xl font-semibold">
            {tSpecs("relatedTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}

      <FeedbackCta productTitle={text.title} />
    </Container>
  );
}
