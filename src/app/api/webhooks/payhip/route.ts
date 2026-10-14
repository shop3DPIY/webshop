import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Receives Payhip's sale notification and syncs it into Supabase as an
 * order (+ order_items, + entitlements when the buyer already has an
 * account).
 *
 * IMPORTANT — verify before activating:
 * Payhip's exact webhook payload shape and any native signing/verification
 * it offers were NOT verified against their current docs while building
 * this (no live Payhip account to test against). The field names guessed
 * below (email, sale/order id, product id, price) are Payhip's commonly
 * documented ones, but double-check the real payload (Payhip's dashboard
 * usually lets you view recent webhook deliveries) before relying on this
 * in production, and adjust `parsePayhipPayload` if needed.
 *
 * Verification here is a shared secret WE define (?secret=... matching
 * PAYHIP_WEBHOOK_SECRET), configured as part of the webhook URL in the
 * Payhip dashboard — this doesn't depend on Payhip supporting any
 * particular signing scheme. See SETUP.md.
 *
 * Payhip doesn't know about our accounts, so linking works by email:
 * if a matching profile already exists, the order + entitlements are
 * attached immediately; otherwise they stay unclaimed until that email
 * signs up (see claim_orders_for_new_profile in the SQL migration).
 */

interface PayhipItem {
  externalProductId: string | null;
  title: string | null;
  priceCents: number | null;
}

interface PayhipOrder {
  orderId: string;
  buyerEmail: string;
  totalCents: number | null;
  currency: string | null;
  items: PayhipItem[];
}

function toCents(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && !Number.isNaN(num) ? Math.round(num * 100) : null;
}

function parsePayhipPayload(body: Record<string, unknown>): PayhipOrder | null {
  const buyerEmail = (body.email ?? body.buyer_email) as string | undefined;
  if (!buyerEmail) return null;

  const orderId =
    (body.sale_id ?? body.order_id ?? body.id ?? crypto.randomUUID()) as string;

  const rawItems = Array.isArray(body.items) ? body.items : [body];

  const items: PayhipItem[] = rawItems.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      externalProductId: (record.product_id ?? record.permalink ?? null) as string | null,
      title: (record.product_name ?? record.title ?? null) as string | null,
      priceCents: toCents(record.price ?? record.cost),
    };
  });

  return {
    orderId,
    buyerEmail,
    totalCents: toCents(body.total ?? body.price),
    currency: (body.currency as string | undefined) ?? null,
    items,
  };
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.PAYHIP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const rawBody: Record<string, unknown> = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const parsed = parsePayhipPayload(rawBody);
  if (!parsed) {
    return NextResponse.json({ error: "Unrecognized payload" }, { status: 400 });
  }

  // Resolve a profile by email, if one already exists.
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", parsed.buyerEmail)
    .maybeSingle();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .upsert(
      {
        payhip_order_id: parsed.orderId,
        buyer_email: parsed.buyerEmail,
        customer_id: profile?.id ?? null,
        total_cents: parsed.totalCents,
        currency: parsed.currency,
        raw_payload: rawBody,
      },
      { onConflict: "payhip_order_id" },
    )
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Could not store order" }, { status: 500 });
  }

  for (const item of parsed.items) {
    let productId: string | null = null;
    if (item.externalProductId) {
      const { data: product } = await admin
        .from("products")
        .select("id")
        .eq("external_commerce_id", item.externalProductId)
        .maybeSingle();
      productId = product?.id ?? null;
    }

    await admin.from("order_items").insert({
      order_id: order.id,
      product_id: productId,
      external_product_id: item.externalProductId,
      title: item.title,
      price_cents: item.priceCents,
    });

    if (profile?.id && productId) {
      await admin
        .from("entitlements")
        .upsert(
          { customer_id: profile.id, product_id: productId, order_id: order.id },
          { onConflict: "customer_id,product_id" },
        );
    }
  }

  return NextResponse.json({ ok: true });
}
