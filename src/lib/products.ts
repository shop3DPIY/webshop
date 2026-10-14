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
  category: string;
  tags: string[];
  images: { src: string; alt: string }[];
  download_files: { format: "STL" | "3MF"; fileName: string; note?: string }[];
  dimensions: { width: number; depth: number; height: number } | null;
  print_settings: Product["printSettings"] | null;
  version: string;
  last_updated: string;
  license_type: Product["licenseType"];
  is_free: boolean;
  external_commerce_id: string | null;
  publication_status: Product["publicationStatus"];
  related_product_ids: string[] | null;
  external_links: Product["externalLinks"] | null;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category as CollectionSlug,
    tags: row.tags ?? [],
    images: row.images ?? [],
    downloadFiles: row.download_files ?? [],
    dimensions: row.dimensions ?? undefined,
    printSettings: row.print_settings ?? undefined,
    version: row.version,
    lastUpdated: row.last_updated,
    licenseType: row.license_type,
    isFree: row.is_free,
    externalCommerceId: row.external_commerce_id,
    publicationStatus: row.publication_status,
    relatedProductIds: row.related_product_ids ?? undefined,
    externalLinks: row.external_links ?? undefined,
  };
}

const PRODUCT_COLUMNS =
  "id, slug, title, description, category, tags, images, download_files, dimensions, print_settings, version, last_updated, license_type, is_free, external_commerce_id, publication_status, related_product_ids, external_links";

export async function getAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return FALLBACK_PRODUCTS;
  const supabase = createPublicClient();
  const { data } = await supabase!.from("products").select(PRODUCT_COLUMNS);
  return (data as ProductRow[] | null)?.map(mapRow) ?? [];
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
  return (data as ProductRow[] | null)?.map(mapRow) ?? [];
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
  return data ? mapRow(data as ProductRow) : undefined;
}

export async function getProductsByCategory(category: CollectionSlug): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return FALLBACK_PRODUCTS.filter((p) => p.category === category && p.publicationStatus === "published");
  }
  const supabase = createPublicClient();
  const { data } = await supabase!
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("category", category)
    .eq("publication_status", "published");
  return (data as ProductRow[] | null)?.map(mapRow) ?? [];
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
  return (data as ProductRow[] | null)?.map(mapRow) ?? [];
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
  return (data as ProductRow[] | null)?.map(mapRow) ?? [];
}
