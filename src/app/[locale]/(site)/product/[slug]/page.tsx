import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SpecList } from "@/components/product/SpecList";
import { ProductCard } from "@/components/product/ProductCard";
import { FeedbackCta } from "@/components/product/FeedbackCta";
import { MakesSection } from "@/components/makes/MakesSection";
import { Link } from "@/i18n/navigation";
import { TrackMarker } from "@/components/system/TrackMarker";
import { COLLECTION_CLASSNAMES, getCollection } from "@/lib/config/colors";
import {
  getAllProducts,
  getBundlesContaining,
  getProductBySlug,
  getProductsByIds,
  getRelatedProducts,
} from "@/lib/products";
import { commerceProvider, isListed } from "@/lib/commerce";
import { FreeDownloadForm } from "@/components/product/FreeDownloadForm";
import { BuyButton } from "@/components/product/BuyButton";
import { ProductGallery } from "@/components/product/ProductGallery";
import { formatEuro } from "@/lib/pricing/calculate";
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
  const locale = await getLocale();
  const text = productText(product, locale);
  return {
    title: text.title,
    description: text.description,
    ...(product.tags.length > 0 && { keywords: product.tags }),
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
  const locale = await getLocale();
  const text = productText(product, locale);
  const tSpecs = await getTranslations("productPage.specs");
  const tBuy = await getTranslations("productPage.buy");
  const tLicense = await getTranslations("licenseTypes");
  const tLicenseHint = await getTranslations("licenseHints");
  const collection = getCollection(product.category);
  const classes = COLLECTION_CLASSNAMES[product.category];
  const cover = product.images[0];
  const related = await getRelatedProducts(product);
  // A bundle shows what's in it; a single design, the bundles it's in.
  const bundleItems = await getProductsByIds(product.bundleProductIds ?? []);
  const inBundles =
    bundleItems.length > 0 ? [] : await getBundlesContaining(product.id);
  const tBundle = await getTranslations("productPage.bundle");
  const checkout = commerceProvider.getCheckoutLink(product);
  // Business designs come in several licenses (chosen at checkout) —
  // show the lowest.
  const priceLabel =
    product.priceCents == null
      ? null
      : collection.track === "business"
        ? tBuy("from", { price: formatEuro(product.priceCents) })
        : formatEuro(product.priceCents);

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
      hint: {
        text: tLicenseHint(product.licenseType),
        linkLabel: tLicenseHint("more"),
        href: "/legal/license",
      },
    },
    {
      label: tSpecs("version"),
      value: product.version,
    },
    {
      label: tSpecs("lastUpdated"),
      value: new Date(product.lastUpdated).toLocaleDateString(
        locale === "nl" ? "nl-NL" : "en-GB",
        { day: "numeric", month: "long", year: "numeric" },
      ),
    },
  ].filter(
    (
      row,
    ): row is {
      label: string;
      value: string;
      hint?: { text: string; linkLabel: string; href: string };
    } => Boolean(row),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: text.title,
    description: text.description,
    sku: product.slug,
    category: collection.name,
    ...(product.tags.length > 0 && { keywords: product.tags.join(", ") }),
    ...(cover && { image: `https://3dpiy.com${cover.src}` }),
    ...(checkout.mode === "redirect" &&
      checkout.url && {
        offers: {
          "@type": "Offer",
          url: checkout.url,
          availability: "https://schema.org/InStock",
          ...(product.isFree
            ? { price: "0", priceCurrency: "EUR" }
            : product.priceCents != null && {
                price: (product.priceCents / 100).toFixed(2),
                priceCurrency: "EUR",
              }),
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

      {/* Phones: title and price first, then the photos, then the rest.
          Wide screens: photos on the left, title + rest on the right. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-10">
        <div className="flex flex-col gap-2 lg:col-start-2 lg:row-start-1">
          <h1 className="font-display text-ink text-3xl font-bold sm:text-4xl">
            {text.title}
          </h1>
          {/* The buy box sits below the photos on phones — the price and a
              jump link up here keep it in the first screen. */}
          {!product.isFree && priceLabel && checkout.mode === "redirect" && (
            <a
              href="#buy"
              className="text-ink flex items-baseline gap-2 lg:hidden"
            >
              <span className="font-display text-xl font-bold">{priceLabel}</span>
              <span className="text-ink/60 text-xs">{tBuy("inclVat")}</span>
              <span className="text-ink/70 ml-auto text-sm font-semibold underline underline-offset-2">
                {tBuy("buyNow")} ↓
              </span>
            </a>
          )}
          {product.isFree && (
            <a href="#buy" className="text-ink text-sm font-semibold underline underline-offset-2 lg:hidden">
              {t("free.jump")} ↓
            </a>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {(() => {
            const badge = (
              <Badge className="bg-white/90 text-night border-white pointer-events-none absolute top-4 left-4 gap-1.5 border">
                <span
                  className={`h-2 w-2 rounded-full ${classes.bg}`}
                  aria-hidden
                />
                {collection.name}
              </Badge>
            );
            return cover ? (
              <ProductGallery
                images={product.images}
                borderClass={classes.border}
                washClass={classes.wash}
                badge={badge}
              />
            ) : (
              <div
                className={`glass relative aspect-square overflow-hidden rounded-xl ${classes.border} ${classes.wash}`}
              >
                {badge}
              </div>
            );
          })()}

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
                className={`glass w-full rounded-xl ${classes.border}`}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:col-start-2 lg:row-start-2">
          <p className="text-ink/70 text-base sm:text-lg">{text.description}</p>

          {(product.externalLinks?.compatible?.length ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink/60">{t("compatibleWith")}:</span>
              {product.externalLinks!.compatible!.map((link) =>
                link.url ? (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-line hover:bg-mist rounded-full border px-3 py-1 font-medium transition-colors"
                  >
                    {link.label} ↗
                  </a>
                ) : (
                  <span
                    key={link.label}
                    className="border-line rounded-full border px-3 py-1 font-medium"
                  >
                    {link.label}
                  </span>
                ),
              )}
            </div>
          )}

          {product.printSettings?.instructions && (
            <p className="text-ink/70 text-sm">
              {product.printSettings.instructions}
            </p>
          )}

          <div id="buy" className="scroll-mt-24 rounded-3xl p-6 glass">
            {product.isFree ? (
              <FreeDownloadForm productId={product.id} />
            ) : checkout.mode === "redirect" && checkout.url ? (
              <div className="flex flex-col gap-4">
                {priceLabel && (
                  <p className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold">
                      {priceLabel}
                    </span>
                    <span className="text-ink/60 text-sm">
                      {tBuy("inclVat")}
                    </span>
                  </p>
                )}
                <BuyButton
                  href={checkout.url}
                  label={tBuy("buyNow")}
                  loadingLabel={tBuy("loading")}
                  productSlug={product.slug}
                />
              </div>
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
            {/* Said once here for every design, so descriptions don't
                each have to repeat it. */}
            <p className="text-ink/60 border-line mt-4 border-t pt-4 text-xs">
              {tBuy("digitalNote")}
            </p>
          </div>

          <SpecList rows={specRows} />

          {/* Search words: visible (Google reads page text, not hidden
              keywords) and each one searches the shop for more like it. */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/shop?q=${encodeURIComponent(tag)}#all-designs`}
                  className="border-line hover:bg-mist rounded-full border px-3 py-1 text-xs transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buyers' photos — not for bundles (their designs have their own). */}
      {bundleItems.length === 0 && <MakesSection productId={product.id} />}

      {bundleItems.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-ink text-2xl font-semibold">
            {tBundle("includes", { count: bundleItems.length })}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bundleItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {inBundles.length > 0 && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-display text-ink text-2xl font-semibold">
              {tBundle("alsoIn")}
            </h2>
            <p className="text-ink/70 mt-1 text-sm">{tBundle("alsoInBody")}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {inBundles.map((bundle) => (
              <ProductCard key={bundle.id} product={bundle} />
            ))}
          </div>
        </div>
      )}

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

      <FeedbackCta productSlug={product.slug} />
    </Container>
  );
}
