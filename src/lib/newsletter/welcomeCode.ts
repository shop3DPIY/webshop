import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPolarConfigured, polarFetch } from "@/lib/commerce/polar/api";

/**
 * The newsletter welcome gift: 10% off once, for a newly confirmed
 * subscriber. Not watertight against a second address (nothing is), but:
 * - only after double opt-in, so the address really works;
 * - one code per address, ever (newsletter_subscribers.welcome_code);
 * - none for an address that has bought before;
 * - the Polar code works once and for 60 days.
 * Returns the code, or null when there's none to give.
 */
const PERCENT = 10;
const VALID_DAYS = 60;

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return `WELKOM${Array.from(randomBytes(6), (b) => alphabet[b % alphabet.length]).join("")}`;
}

export async function ensureWelcomeCode(email: string): Promise<string | null> {
  if (!isPolarConfigured()) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const address = email.trim().toLowerCase();

  const { data: subscriber } = await admin
    .from("newsletter_subscribers")
    .select("id, welcome_code")
    .eq("email", address)
    .maybeSingle();
  if (!subscriber || subscriber.welcome_code) return null;

  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .ilike("buyer_email", address.replace(/[\\%_]/g, "\\$&"));
  if ((count ?? 0) > 0) return null;

  const code = makeCode();
  try {
    await polarFetch("/discounts/", {
      method: "POST",
      body: {
        name: `Welcome ${PERCENT}%`,
        code,
        type: "percentage",
        basis_points: PERCENT * 100,
        duration: "once",
        max_redemptions: 1,
        ends_at: new Date(Date.now() + VALID_DAYS * 86_400_000).toISOString(),
        metadata: { source: "newsletter-welcome", subscriber_id: subscriber.id },
      },
    });
  } catch (error) {
    console.error("[newsletter] welcome code failed", error);
    return null;
  }
  await admin
    .from("newsletter_subscribers")
    .update({ welcome_code: code, welcome_code_at: new Date().toISOString() })
    .eq("id", subscriber.id);
  return code;
}
