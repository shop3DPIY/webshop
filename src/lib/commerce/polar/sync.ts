import { createAdminClient } from "@/lib/supabase/admin";
import { PRICE_TIERS, type PriceTier } from "@/lib/pricing/calculate";
import { storedPrices } from "@/lib/pricing/settings";
import {
  isPolarConfigured,
  polarFetch,
  type PolarCustomField,
  type PolarList,
  type PolarProduct,
} from "./api";

/**
 * Keeps Polar's catalog in step with ours, so nothing is ever created by
 * hand in the Polar dashboard.
 *
 * Polar has one price per product, so each license tier of a design is
 * its own Polar product ("<title> — Personal license", ...). Their ids
 * are stored per tier in products.commerce_product_ids; the checkout
 * route offers all of a design's tiers in one checkout.
 *
 * Polar products are always "private": they never appear on a Polar
 * storefront, only in checkouts our site creates. A free or archived
 * design, or a tier without a price, gets its Polar product archived
 * (Polar can't delete products that may have orders).
 */

export const TIER_LABELS: Record<PriceTier, string> = {
  personal: "Personal license",
  small: "Small business license",
  unlimited: "Unlimited commercial license",
};

type TierIds = Partial<Record<PriceTier, string>>;

function polarName(title: string, tier: PriceTier) {
  const suffix = ` — ${TIER_LABELS[tier]}`;
  const max = 64 - suffix.length;
  const base = title.length > max ? `${title.slice(0, max - 1)}…` : title;
  return `${base}${suffix}`;
}

/**
 * EU law: a buyer of a digital download keeps a 14-day right of
 * withdrawal unless they explicitly agree, before paying, that delivery
 * starts right away and that they lose that right. Polar's checkout has
 * no such consent of its own, so every product gets this required
 * checkbox (a Polar "custom field", created once and reused).
 */
const WAIVER_SLUG = "withdrawal-waiver";

let waiverFieldId: string | null = null;

async function getWaiverFieldId(): Promise<string> {
  if (waiverFieldId) return waiverFieldId;
  const list = await polarFetch<PolarList<PolarCustomField>>(
    `/custom-fields/?query=${WAIVER_SLUG}&limit=100`,
  );
  const found = list.items.find((f) => f.slug === WAIVER_SLUG);
  const field =
    found ??
    (await polarFetch<PolarCustomField>("/custom-fields/", {
      method: "POST",
      body: {
        type: "checkbox",
        slug: WAIVER_SLUG,
        name: "Immediate delivery / right of withdrawal",
        properties: {
          form_label:
            "I want my download right away and agree that I lose my right of withdrawal / Ik wil direct downloaden en ziet af van mijn herroepingsrecht",
        },
      },
    }));
  waiverFieldId = field.id;
  return field.id;
}

function desiredPrice(product: PolarProduct) {
  return product.prices.find((p) => !p.is_archived && p.amount_type === "fixed");
}

/**
 * Creates, updates or archives the Polar products for one design and
 * stores their ids. Safe to call on every save: it only sends what
 * changed. Does nothing when Polar isn't configured.
 */
export async function syncProductToPolar(productId: string): Promise<void> {
  if (!isPolarConfigured()) return;
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");

  const { data: row, error } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
  if (error || !row) throw error ?? new Error(`Product ${productId} not found`);

  const sellable = !row.is_free && row.publication_status !== "archived";
  const prices = storedPrices(row).chosen;
  const ids: TierIds = { ...(row.commerce_product_ids ?? {}) };

  for (const tier of PRICE_TIERS) {
    const cents = prices[tier];
    const wanted = sellable && cents != null && cents > 0;
    const existing = ids[tier]
      ? await polarFetch<PolarProduct>(`/products/${ids[tier]}`)
      : null;

    if (!wanted) {
      if (existing && !existing.is_archived) {
        await polarFetch(`/products/${existing.id}`, {
          method: "PATCH",
          body: { is_archived: true },
        });
      }
      continue;
    }

    const name = polarName(row.title, tier);
    const fields = [{ custom_field_id: await getWaiverFieldId(), required: true }];
    const description = row.description || null;
    const price = {
      amount_type: "fixed",
      price_amount: cents,
      price_currency: "eur",
      // Dutch consumer prices are shown including VAT.
      tax_behavior: "inclusive",
    };

    if (!existing) {
      const created = await polarFetch<PolarProduct>("/products/", {
        method: "POST",
        body: {
          name,
          description,
          visibility: "private",
          prices: [price],
          attached_custom_fields: fields,
          metadata: { product_id: row.id, tier },
        },
      });
      ids[tier] = created.id;
      continue;
    }

    const current = desiredPrice(existing);
    const update: Record<string, unknown> = {};
    if (existing.is_archived) update.is_archived = false;
    if (existing.name !== name) update.name = name;
    if ((existing.description ?? null) !== description)
      update.description = description;
    if (current?.price_amount !== cents || current?.price_currency !== "eur")
      update.prices = [price];
    const waiver = existing.attached_custom_fields?.find(
      (f) => f.custom_field_id === fields[0].custom_field_id,
    );
    if (!waiver?.required) update.attached_custom_fields = fields;
    if (Object.keys(update).length > 0) {
      await polarFetch(`/products/${existing.id}`, {
        method: "PATCH",
        body: update,
      });
    }
  }

  const { error: saveError } = await admin
    .from("products")
    .update({ commerce_product_ids: ids })
    .eq("id", row.id);
  if (saveError) throw saveError;
}

/**
 * Sync without letting a Polar hiccup break the caller (a Studio save or
 * an ingest run): the product is saved either way, and the next save —
 * or Studio → Products → "Sync with Polar" — catches up.
 */
export async function trySyncProductToPolar(
  productId: string,
): Promise<string | null> {
  try {
    await syncProductToPolar(productId);
    return null;
  } catch (error) {
    console.error(`[polar] sync failed for ${productId}`, error);
    return error instanceof Error ? error.message : String(error);
  }
}
