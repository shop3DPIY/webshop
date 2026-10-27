import { createAdminClient } from "@/lib/supabase/admin";
import { polarFetch, type PolarCheckout, type PolarList, type PolarOrder } from "./api";
import { fulfillPolarOrder } from "./fulfill";

/** How long the thank-you page's download links keep working. */
const GUEST_DOWNLOAD_DAYS = 7;

export type CheckoutResult =
  | { status: "paid"; productId: string; email: string }
  | { status: "pending" }
  | { status: "invalid" };

/**
 * The thank-you page's check: asks Polar (never the URL) whether this
 * checkout was paid, and stores the order if the webhook hasn't yet.
 */
export async function confirmCheckout(checkoutId: string): Promise<CheckoutResult> {
  if (!/^[0-9a-f-]{36}$/i.test(checkoutId)) return { status: "invalid" };

  let checkout: PolarCheckout;
  try {
    checkout = await polarFetch<PolarCheckout>(`/checkouts/${checkoutId}`);
  } catch {
    return { status: "invalid" };
  }
  if (checkout.status === "confirmed") return { status: "pending" };
  if (checkout.status !== "succeeded") return { status: "invalid" };

  const orders = await polarFetch<PolarList<PolarOrder>>(
    `/orders/?checkout_id=${checkoutId}`,
  );
  const order = orders.items.find((o) => o.checkout_id === checkoutId && o.paid);
  // Paid, but Polar hasn't created the order yet — a moment later it has.
  if (!order) return { status: "pending" };

  const { productId } = await fulfillPolarOrder(order, { type: "checkout.success", data: order });
  if (!productId) return { status: "invalid" };
  return { status: "paid", productId, email: order.customer.email };
}

/**
 * For the thank-you page's download buttons: the product a checkout paid
 * for, from our own orders table (written by confirmCheckout or the
 * webhook) — valid for GUEST_DOWNLOAD_DAYS after the purchase. After
 * that the buyer downloads from their account library.
 */
export async function productForRecentCheckout(
  checkoutId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(checkoutId)) return null;

  const since = new Date(Date.now() - GUEST_DOWNLOAD_DAYS * 86_400_000).toISOString();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_items(product_id)")
    .eq("checkout_id", checkoutId)
    .gte("created_at", since)
    .maybeSingle();

  const items = (order?.order_items ?? []) as { product_id: string | null }[];
  return items.find((item) => item.product_id)?.product_id ?? null;
}
