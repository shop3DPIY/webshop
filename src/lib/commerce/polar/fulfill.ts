import { createAdminClient } from "@/lib/supabase/admin";
import { PRICE_TIERS, type PriceTier } from "@/lib/pricing/calculate";
import type { PolarOrder } from "./api";
import { bundleContents } from "@/lib/studio/bundles";
import { sendPurchaseMail } from "./purchaseMail";

/**
 * Stores a paid Polar order as an order + order item and, when the buyer
 * already has an account, an entitlement (their download library).
 *
 * Called from two places, both with an order fetched from / signed by
 * Polar: the webhook (src/app/api/webhooks/polar) and the thank-you page
 * (so a purchase shows up even before — or without — the webhook).
 * Idempotent: the order is keyed on Polar's order id.
 *
 * Accounts are matched first on external_customer_id (set by the
 * checkout route for signed-in buyers), then on email. Orders without a
 * matching account stay unclaimed until that email signs up — see
 * claim_orders_for_new_profile in 0001_init.sql.
 */
export async function fulfillPolarOrder(
  order: PolarOrder,
  rawPayload: unknown,
): Promise<{ productId: string | null }> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");

  const meta = { ...order.metadata, ...(order.product?.metadata ?? {}) };
  const productId = typeof meta.product_id === "string" ? meta.product_id : null;
  const tier = PRICE_TIERS.includes(meta.tier as PriceTier)
    ? (meta.tier as PriceTier)
    : null;

  const email = order.customer.email.toLowerCase();
  const externalId = order.customer.external_id;
  const { data: profile } = externalId
    ? await admin.from("profiles").select("id").eq("id", externalId).maybeSingle()
    : await admin.from("profiles").select("id").ilike("email", email).maybeSingle();

  const row = {
    external_order_id: order.id,
    checkout_id: order.checkout_id,
    buyer_email: email,
    customer_id: profile?.id ?? null,
    total_cents: order.total_amount,
    currency: order.currency.toUpperCase(),
    raw_payload: rawPayload,
  };
  // Insert first: only the call that actually creates the order (the
  // webhook and the thank-you page can arrive at the same moment) sends
  // the confirmation mail below. A duplicate updates the existing row.
  let isNew = true;
  let { data: stored, error } = await admin.from("orders").insert(row).select("id").single();
  if (error?.code === "23505") {
    isNew = false;
    ({ data: stored, error } = await admin
      .from("orders")
      .update(row)
      .eq("external_order_id", order.id)
      .select("id")
      .single());
  }
  if (error || !stored) throw error ?? new Error("Could not store order");

  const { data: existingItem } = await admin
    .from("order_items")
    .select("id")
    .eq("order_id", stored.id)
    .maybeSingle();
  if (!existingItem) {
    await admin.from("order_items").insert({
      order_id: stored.id,
      product_id: productId,
      external_product_id: order.product_id,
      title: order.product?.name ?? null,
      price_cents: order.total_amount,
      license_tier: tier,
    });
  }

  if (profile?.id && productId) {
    // A bundle gives every design inside it too.
    const ids = [productId, ...(await bundleContents(productId))];
    await admin
      .from("entitlements")
      .upsert(
        ids.map((id) => ({
          customer_id: profile.id,
          product_id: id,
          order_id: stored.id,
        })),
        { onConflict: "customer_id,product_id" },
      );
  }

  if (isNew && productId) {
    await sendPurchaseMail({
      email,
      productId,
      tier,
      locale: meta.locale === "nl" ? "nl" : "en",
    }).catch((e) => console.error("[polar] purchase mail failed", e));
  }

  return { productId };
}
