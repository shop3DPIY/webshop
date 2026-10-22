import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLLECTIONS, type CollectionSlug } from "@/lib/config/colors";
import {
  COMPLEXITIES,
  PRICE_TIERS,
  calculatePrices,
  parseEuroToCents,
  tierCents,
  withDefaults,
  type Complexity,
  type PriceTier,
  type PricingSettings,
} from "./calculate";

/**
 * Loads the price table from Supabase (single row, see migration 0008).
 * Callers are Studio pages/actions (behind requireAdmin) and the ingest
 * route (shared-secret) — hence the service-role client. Falls back to the
 * defaults when nothing has been saved yet.
 */
export async function getPricingSettings(): Promise<PricingSettings> {
  const admin = createAdminClient();
  if (!admin) return withDefaults(null);
  const { data } = await admin.from("pricing_settings").select("settings").eq("id", 1).maybeSingle();
  return withDefaults(data?.settings ?? null);
}

export const COLLECTION_NAMES = Object.fromEntries(
  Object.values(COLLECTIONS).map((c) => [c.slug, c.name]),
) as Record<CollectionSlug, string>;

const TIER_COLUMN: Record<PriceTier, { chosen: string; calc: string }> = {
  personal: { chosen: "price_cents", calc: "price_personal_calc_cents" },
  small: { chosen: "price_small_cents", calc: "price_small_calc_cents" },
  unlimited: { chosen: "price_unlimited_cents", calc: "price_unlimited_calc_cents" },
};

/** The product columns (see migration 0008) for a set of chosen prices. */
export function priceColumns(
  calc: Record<PriceTier, number>,
  chosen: Record<PriceTier, number>,
) {
  const columns: Record<string, number | string[]> = {};
  const overrides: PriceTier[] = [];
  for (const tier of PRICE_TIERS) {
    columns[TIER_COLUMN[tier].calc] = calc[tier];
    columns[TIER_COLUMN[tier].chosen] = chosen[tier];
    if (chosen[tier] !== calc[tier]) overrides.push(tier);
  }
  columns.price_overrides = overrides;
  return columns;
}

export interface StoredPrices {
  chosen: Partial<Record<PriceTier, number | null>>;
  calc: Partial<Record<PriceTier, number | null>>;
}

/** The stored prices of a product row, per tier. */
export function storedPrices(row: Record<string, unknown> | null | undefined): StoredPrices {
  const chosen: StoredPrices["chosen"] = {};
  const calc: StoredPrices["calc"] = {};
  for (const tier of PRICE_TIERS) {
    chosen[tier] = (row?.[TIER_COLUMN[tier].chosen] as number | null) ?? null;
    calc[tier] = (row?.[TIER_COLUMN[tier].calc] as number | null) ?? null;
  }
  return { chosen, calc };
}

/**
 * Reads the pricing inputs and prices from the product form, recalculates
 * on the server, and returns the columns to save. Per tier the form sends
 * a mode (`price_<tier>_mode`):
 * - "calc" (or missing): use the freshly calculated price;
 * - "manual": use the typed price — an override unless it equals the calc;
 * - "keep": an existing product whose price predates a change to the
 *   price table and whose inputs weren't touched — keep its stored price,
 *   so editing a description never silently re-prices a product (that's
 *   what the recalculate screen is for).
 * The ingest route sends none of these fields, so its drafts get the
 * calculated prices for a standard single model.
 */
export function productPricingFromForm(
  formData: FormData,
  category: string,
  settings: PricingSettings,
  existing?: StoredPrices,
) {
  const complexityInput = String(formData.get("complexity") ?? "standard");
  const complexity: Complexity = COMPLEXITIES.includes(complexityInput as Complexity)
    ? (complexityInput as Complexity)
    : "standard";
  const isSet = formData.get("isSet") === "on";
  const partCount = isSet ? Math.max(1, Math.floor(Number(formData.get("partCount")) || 1)) : 1;
  const includesStep = formData.get("includesStep") === "on";

  const slug = (category in COLLECTIONS ? category : "other") as CollectionSlug;
  const result = calculatePrices(settings, {
    category: slug,
    complexity,
    isSet,
    partCount,
    includesStep,
  });

  const calc = {} as Record<PriceTier, number>;
  const chosen = {} as Record<PriceTier, number>;
  for (const tier of PRICE_TIERS) {
    const mode = String(formData.get(`price_${tier}_mode`) ?? "calc");
    const fresh = tierCents(result, tier);
    const keptChosen = existing?.chosen[tier];
    if (mode === "keep" && keptChosen != null) {
      chosen[tier] = keptChosen;
      calc[tier] = existing?.calc[tier] ?? keptChosen;
    } else if (mode === "manual") {
      calc[tier] = fresh;
      chosen[tier] = parseEuroToCents(String(formData.get(`price_${tier}`) ?? "")) ?? fresh;
    } else {
      calc[tier] = fresh;
      chosen[tier] = fresh;
    }
  }

  return {
    complexity,
    is_set: isSet,
    part_count: partCount,
    includes_step: includesStep,
    ...priceColumns(calc, chosen),
  };
}
