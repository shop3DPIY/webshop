import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/products";
import { COLLECTION_LIST } from "@/lib/config/colors";
import { routing } from "@/i18n/routing";

const siteUrl = "https://3dpiy.com";

const LEGAL_DOCS = ["privacy", "cookies", "terms", "delivery", "license"];

const STATIC_ROUTES = [
  "",
  "/shop",
  "/free-designs",
  "/business",
  "/about",
  "/contact",
  ...LEGAL_DOCS.map((doc) => `/legal/${doc}`),
];

/** English (default locale) has no URL prefix; other locales do. */
function localizedUrl(locale: string, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${siteUrl}${prefix}${path}`;
}

function withAlternates(path: string) {
  return {
    url: localizedUrl(routing.defaultLocale, path),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, localizedUrl(locale, path)]),
      ),
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_ROUTES.map((path) => withAlternates(path));

  const collectionEntries = COLLECTION_LIST.map((collection) =>
    withAlternates(`/collections/${collection.slug}`),
  );

  const products = await getPublishedProducts();
  const productEntries = products.map((product) => ({
    ...withAlternates(`/product/${product.slug}`),
    lastModified: product.lastUpdated,
  }));

  return [...staticEntries, ...collectionEntries, ...productEntries];
}
