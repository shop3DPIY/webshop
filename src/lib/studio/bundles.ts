import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLLECTIONS, type CollectionSlug } from "@/lib/config/colors";
import {
  PRICE_TIERS,
  bundlePriceCents,
  parseEuroToCents,
  sellableTiers,
  type PriceTier,
} from "@/lib/pricing/calculate";
import { priceColumns, storedPrices } from "@/lib/pricing/settings";
import type { BundleCandidate } from "@/components/studio/BundleFields";

/**
 * Bundles (migration 0016): a product with bundle_product_ids is a
 * bundle of those designs. Server helpers for Studio's form and save.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const trackOf = (category: string) => COLLECTIONS[category as CollectionSlug]?.track;

/** Designs that can go in a bundle: everything but bundles (and itself). */
export async function getBundleCandidates(excludeId?: string): Promise<BundleCandidate[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("products")
    .select("*")
    .neq("publication_status", "archived")
    .order("title");
  return (data ?? [])
    .filter((p) => p.id !== excludeId && !(p.bundle_product_ids?.length > 0) && !p.is_free)
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      status: p.publication_status,
      prices: storedPrices(p).chosen,
    }));
}

/**
 * The bundle part of a save. `undefined` = the form had no bundle fields
 * (the ingest route) → leave bundle and prices as they are. Otherwise the
 * included ids (validated: existing, not bundles, same track) plus — for
 * a bundle — its price columns, overriding the complexity-based ones.
 */
export async function bundleFromForm(
  formData: FormData,
  category: string,
  selfId: string,
): Promise<{ bundle_product_ids: string[]; prices?: Record<string, number | string[]> } | undefined> {
  if (!formData.has("bundleMode")) return undefined;
  const wanted =
    formData.get("isBundle") === "on"
      ? [...new Set(formData.getAll("bundleProductIds").map(String))].filter(
          (id) => UUID_RE.test(id) && id !== selfId,
        )
      : [];
  if (wanted.length === 0) return { bundle_product_ids: [] };

  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const { data: rows } = await admin.from("products").select("*").in("id", wanted);
  const included = (rows ?? []).filter(
    (p) =>
      !(p.bundle_product_ids?.length > 0) &&
      trackOf(p.category) === trackOf(category),
  );
  if (included.length === 0) return { bundle_product_ids: [] };

  const sellable = sellableTiers(category);
  const calc = {} as Record<PriceTier, number>;
  const chosen = {} as Record<PriceTier, number>;
  for (const tier of PRICE_TIERS) {
    const sum = included.reduce((t, p) => t + (storedPrices(p).chosen[tier] ?? 0), 0);
    calc[tier] = bundlePriceCents(sum);
    const typed = sellable.includes(tier)
      ? parseEuroToCents(String(formData.get(`bundle_price_${tier}`) ?? ""))
      : null;
    chosen[tier] = typed && typed > 0 ? typed : calc[tier];
  }
  return {
    bundle_product_ids: included.map((p) => p.id),
    prices: priceColumns(calc, chosen),
  };
}

/** The designs inside a bundle (empty for a normal product). */
export async function bundleContents(productId: string): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("products")
    .select("bundle_product_ids")
    .eq("id", productId)
    .maybeSingle();
  return (data?.bundle_product_ids as string[] | undefined) ?? [];
}

/** Ids of the bundles that contain a design. */
export async function bundlesContaining(productId: string): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("products")
    .select("id")
    .contains("bundle_product_ids", [productId]);
  return (data ?? []).map((p) => p.id as string);
}
