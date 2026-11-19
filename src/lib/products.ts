import type { CollectionSlug } from "@/lib/config/colors";
import type { Product } from "@/types/product";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import aptitligHolder from "@/content/products/ikea-aptitlig-holder-4slot.json";

/**
 * Product catalog. Reads from Supabase (written to by 3DPIY Studio) once
 * it's configured; falls back to the static example JSON otherwise, so the
 * site still works for local development with no Supabase project set up.
 *
 * Uses the cookie-less public client (src/lib/supabase/public.ts), not the
 * session-aware server client: these reads happen on pages visited by
 * signed-out customers, and some (generateStaticParams) run at build time
 * with no HTTP request/cookies at all. Row Level Security (see
 * supabase/migrations/0001_init.sql) restricts "products" to published
 * rows for this anon client either way — draft products are simply
 * invisible here, admin preview happens in Studio instead.
 */

const FALLBACK_PRODUCTS: Product[] = [aptitligHolder as Product];

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  title_nl: string | null;
  description_nl: string | null;
  category: string;
  extra_categories: string[] | null;
  tags: string[];
  images: { src: string; alt: string }[];
  timelapse_url: string | null;
  download_files: { format: "STL" | "3MF"; fileName: string; note?: string }[];
  dimensions: { width: number; depth: number; height: number } | null;
  print_settings: Product["printSettings"] | null;
  version: string;
  last_updated: string;
  license_type: Product["licenseType"];
  is_free: boolean;
  commerce_product_ids: Product["commerceProductIds"] | null;
  publication_status: Product["publicationStatus"];
  related_product_ids: string[] | null;
  external_links: Product["externalLinks"] | null;
  price_cents: number | null;
  bundle_product_ids: string[] | null;
  product_kind: "print" | "pattern" | null;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    titleNl: row.title_nl ?? undefined,
    descriptionNl: row.description_nl ?? undefined,
    category: row.category as CollectionSlug,
    extraCategories: (row.extra_categories ?? []) as CollectionSlug[],
    tags: row.tags ?? [],
    images: row.images ?? [],
    timelapseUrl: row.timelapse_url ?? undefined,
    downloadFiles: row.download_files ?? [],
    dimensions: row.dimensions ?? undefined,
    printSettings: row.print_settings ?? undefined,
    version: row.version,
    lastUpdated: row.last_updated,
    licenseType: row.license_type,
    isFree: row.is_free,
    commerceProductIds: row.commerce_product_ids ?? {},
    publicationStatus: row.publication_status,
    relatedProductIds: row.related_product_ids ?? undefined,
    externalLinks: row.external_links ?? undefined,
    priceCents: row.price_cents,
    bundleProductIds: row.bundle_product_ids ?? [],
    productKind: row.product_kind ?? "print",
  };
}

/**
 * A bundle without photos of its own shows the cover photos of the
 * designs inside it (cards, product page gallery). One extra query, only
 * when such a bundle is in the list.
 */
async function withBundleImages(products: Product[]): Promise<Product[]> {
  const needy = products.filter(
    (p) => p.images.length === 0 && (p.bundleProductIds?.length ?? 0) > 0,
  );
  if (needy.length === 0 || !isSupabaseConfigured()) return products;
  const ids = [...new Set(needy.flatMap((p) => p.bundleProductIds!))];
  const { data } = await createPublicClient()!
    .from("products")
    .select("id, images")
    .in("id", ids);
  const covers = new Map(
    (data ?? []).map((row) => [row.id as string, (row.images as Product["images"])?.[0]]),
  );
  return products.map((p) =>
    needy.includes(p)
      ? {
          ...p,
          images: p.bundleProductIds!
            .map((id) => covers.get(id))
            .filter((img): img is Product["images"][number] => Boolean(img)),
        }
      : p,
  );
}

const PRODUCT_COLUMNS =
  "id, slug, title, description, title_nl, description_nl, category, extra_categories, tags, images, timelapse_url, download_files, dimensions, print_settings, version, last_updated, license_type, is_free, commerce_product_ids, publication_status, related_product_ids, external_links, price_cents, bundle_product_ids, product_kind";

export async function getAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return FALLBACK_PRODUCTS;
  const supabase = createPublicClient();
  const { data } = await supabase!.from("products").select(PRODUCT_COLUMNS);
  return withBundleImages((data as ProductRow[] | null)?.map(mapRow) ?? []);
}

export async function getPublishedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_PRODUCTS.filter((p) => p.publicationStatus === "published");
  }
  const supabase = createPublicClient();
  const { data } = await supabase!
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("publication_status", "published");
  return withBundleImages((data as ProductRow[] | null)?.map(mapRow) ?? []);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug);
  }
  const supabase = createPublicClient();
  const { data } = await supabase!
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return data ? (await withBundleImages([mapRow(data as ProductRow)]))[0] : undefined;
}

export async function getProductsByCategory(category: CollectionSlug): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_PRODUCTS.filter(
      (p) =>
        (p.category === category || p.extraCategories?.includes(category)) &&
        p.publicationStatus === "published",
    );
  }
  const supabase = createPublicClient();
  const { data } = await supabase!
    .from("products")
    .select(PRODUCT_COLUMNS)
    // Primary category, or listed as one of the extra categories.
    .or(`category.eq.${category},extra_categories.cs.{${category}}`)
    .eq("publication_status", "published");
  return withBundleImages((data as ProductRow[] | null)?.map(mapRow) ?? []);
}

export async function getFreeProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_PRODUCTS.filter((p) => p.isFree && p.publicationStatus === "published");
  }
  const supabase = createPublicClient();
  const { data } = await supabase!
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_free", true)
    .eq("publication_status", "published");
  return withBundleImages((data as ProductRow[] | null)?.map(mapRow) ?? []);
}

export async function getRelatedProducts(product: Product): Promise<Product[]> {
  if (!product.relatedProductIds?.length) return [];

  if (!isSupabaseConfigured()) {
    return product.relatedProductIds
      .map((id) => FALLBACK_PRODUCTS.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }

  const supabase = createPublicClient();
  const { data } = await supabase!
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", product.relatedProductIds)
    .eq("publication_status", "published");
  return withBundleImages((data as ProductRow[] | null)?.map(mapRow) ?? []);
}

/** Published designs by id, in the given order (e.g. a bundle's contents). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  if (!isSupabaseConfigured()) {
    return FALLBACK_PRODUCTS.filter((p) => ids.includes(p.id));
  }
  const supabase = createPublicClient();
  const { data } = await supabase!
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", ids)
    .eq("publication_status", "published");
  const found = await withBundleImages((data as ProductRow[] | null)?.map(mapRow) ?? []);
  return ids
    .map((id) => found.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
}

/** Published bundles that contain a design ("save with the bundle"). */
export async function getBundlesContaining(productId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const { data } = await supabase!
    .from("products")
    .select(PRODUCT_COLUMNS)
    .contains("bundle_product_ids", [productId])
    .eq("publication_status", "published");
  return withBundleImages((data as ProductRow[] | null)?.map(mapRow) ?? []);
}

/** Designs per collection (primary or extra category) — for the tiles. */
export function collectionCounts(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) {
    for (const slug of new Set([p.category, ...(p.extraCategories ?? [])])) {
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
  }
  return counts;
}

/** Newest first (last update, then title). */
export const newestFirst = (a: Product, b: Product) =>
  b.lastUpdated.localeCompare(a.lastUpdated) || a.title.localeCompare(b.title);
