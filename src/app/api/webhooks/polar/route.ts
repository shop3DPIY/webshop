import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { fulfillPolarOrder } from "@/lib/commerce/polar/fulfill";
import type { PolarOrder } from "@/lib/commerce/polar/api";

/**
 * Polar → us: stores each paid order (see fulfillPolarOrder). The
 * thank-you page does the same when the buyer comes back, so this is the
 * safety net for buyers who close the tab before that.
 *
 * Signed per Standard Webhooks (webhook-id / -timestamp / -signature
 * headers, HMAC-SHA256 over "id.timestamp.body"). POLAR_WEBHOOK_SECRET is
 * the secret shown when the endpoint is created in Polar (Settings →
 * Webhooks). Secrets made before 8 Sep 2026 use the UTF-8 bytes of the
 * whole string as key, newer ones the base64 part after "whsec_" — both
 * are accepted.
 */

const TOLERANCE_SECONDS = 5 * 60;

function signingKeys(secret: string): Buffer[] {
  const keys = [Buffer.from(secret, "utf8")];
  if (secret.startsWith("whsec_")) keys.push(Buffer.from(secret.slice(6), "base64"));
  return keys;
}

function isValidSignature(request: NextRequest, body: string): boolean {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const header = request.headers.get("webhook-signature");
  if (!secret || !id || !timestamp || !header) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const signatures = header
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter(Boolean)
    .map((sig) => Buffer.from(sig, "base64"));

  return signingKeys(secret).some((key) => {
    const expected = createHmac("sha256", key)
      .update(`${id}.${timestamp}.${body}`)
      .digest();
    return signatures.some(
      (sig) => sig.length === expected.length && timingSafeEqual(sig, expected),
    );
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  if (!isValidSignature(request, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as { type: string; data: unknown };

  if (event.type === "order.paid") {
    try {
      await fulfillPolarOrder(event.data as PolarOrder, event);
    } catch (error) {
      console.error("[polar webhook] could not store order", error);
      // Non-2xx makes Polar retry the delivery later.
      return NextResponse.json({ error: "Could not store order" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
