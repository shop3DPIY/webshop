import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { commerceProvider } from "@/lib/commerce";
import { polarFetch, type PolarCheckout } from "@/lib/commerce/polar/api";
import { PRICE_TIERS, type PriceTier } from "@/lib/pricing/calculate";

/**
 * The buy button's target: creates a Polar checkout session for all
 * license tiers of one design (the buyer picks one there) and redirects
 * to it. Product pages are static, so this is where the per-visitor
 * part happens — a signed-in buyer's email is prefilled and their
 * account id travels along, so the purchase lands in their library.
 *
 * After paying, Polar sends the buyer to /checkout/success, which looks
 * the order up again with Polar (nothing from the URL is trusted).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  if (!commerceProvider.isEnabled()) {
    return NextResponse.json({ error: "Checkout is not active" }, { status: 404 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { data: product } = await admin
    .from("products")
    .select("id, slug, commerce_product_ids, publication_status, is_free")
    .eq("id", productId)
    .maybeSingle();

  const ids = (product?.commerce_product_ids ?? {}) as Partial<Record<PriceTier, string>>;
  const polarProducts = PRICE_TIERS.map((tier) => ids[tier]).filter(
    (id): id is string => Boolean(id),
  );
  if (
    !product ||
    product.publication_status !== "published" ||
    product.is_free ||
    polarProducts.length === 0
  ) {
    return NextResponse.json({ error: "Not for sale" }, { status: 404 });
  }

  // The visitor's language, from the page they clicked on.
  const referer = request.headers.get("referer") ?? "";
  const locale = /^https?:\/\/[^/]+\/nl(\/|$)/.test(referer) ? "nl" : "en";
  const prefix = locale === "nl" ? "/nl" : "";
  const origin = request.nextUrl.origin;

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const checkout = await polarFetch<PolarCheckout>("/checkouts/", {
    method: "POST",
    body: {
      products: polarProducts,
      success_url: `${origin}${prefix}/checkout/success?checkout_id={CHECKOUT_ID}`,
      return_url: `${origin}${prefix}/product/${product.slug}`,
      locale,
      metadata: { product_id: product.id },
      ...(user?.email && {
        customer_email: user.email,
        external_customer_id: user.id,
      }),
    },
  });

  return NextResponse.redirect(checkout.url, 303);
}
