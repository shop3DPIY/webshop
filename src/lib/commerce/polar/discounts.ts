"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/studio/guard";
import { parseEuroToCents } from "@/lib/pricing/calculate";
import { isPolarConfigured, polarFetch, type PolarList } from "./api";

/**
 * Studio → Discounts: discount codes live in Polar (buyers type them in
 * Polar's checkout, which allows codes by default) but are made and
 * removed from Studio, so the Polar dashboard is never needed.
 */

export interface PolarDiscount {
  id: string;
  name: string;
  code: string | null;
  type: "percentage" | "fixed";
  basis_points?: number;
  amount?: number;
  currency?: string;
  ends_at: string | null;
  max_redemptions: number | null;
  redemptions_count: number;
  products: { id: string; name: string; metadata?: Record<string, unknown> }[];
}

export async function listDiscounts(): Promise<PolarDiscount[]> {
  // Exported from a "use server" file, so callable from outside: admins only.
  await requireAdmin();
  if (!isPolarConfigured()) return [];
  const list = await polarFetch<PolarList<PolarDiscount>>(
    "/discounts/?limit=100&sorting=-created_at",
  );
  return list.items;
}

/** Readable random code, e.g. 3DPIYK7QX2M (no 0/O/1/I mix-ups; Polar only takes letters and digits). */
function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return `3DPIY${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

const back = (query: string): never => redirect(`/studio/discounts?${query}`);

export async function createDiscount(formData: FormData) {
  await requireAdmin();
  if (!isPolarConfigured()) back("error=not-configured");

  const code = (String(formData.get("code") ?? "").trim().toUpperCase() || generateCode())
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 64);
  const name = String(formData.get("name") ?? "").trim().slice(0, 100) || code;
  const kind = formData.get("type") === "fixed" ? "fixed" : "percentage";
  const value = String(formData.get("value") ?? "");
  const maxUses = Math.floor(Number(formData.get("maxRedemptions")) || 0);
  const perCustomerOnce = formData.get("oncePerCustomer") === "on";
  const endsOn = String(formData.get("endsAt") ?? "");
  const productId = String(formData.get("productId") ?? "");

  if (code.length < 3) back("error=code");
  const amount =
    kind === "percentage"
      ? Math.round(Number(value.replace(",", ".")) * 100)
      : parseEuroToCents(value);
  if (!amount || amount <= 0 || (kind === "percentage" && amount > 10000)) back("error=value");

  // "Only for one design": all of that design's Polar products (one per license).
  let products: string[] | undefined;
  if (productId) {
    const { data } = await createAdminClient()!
      .from("products")
      .select("commerce_product_ids")
      .eq("id", productId)
      .maybeSingle();
    products = Object.values((data?.commerce_product_ids ?? {}) as Record<string, string>).filter(Boolean);
    if (products.length === 0) back("error=not-listed");
  }

  try {
    await polarFetch("/discounts/", {
      method: "POST",
      body: {
        name,
        code,
        duration: "once",
        type: kind,
        ...(kind === "percentage"
          ? { basis_points: amount }
          : { amount, currency: "eur" }),
        ...(maxUses > 0 && { max_redemptions: maxUses }),
        ...(perCustomerOnce && { max_redemptions_per_customer: 1 }),
        // End of that day, Dutch time is close enough for a promo.
        ...(endsOn && { ends_at: new Date(`${endsOn}T23:59:59`).toISOString() }),
        ...(products && { products }),
      },
    });
  } catch (error) {
    console.error("[polar] create discount failed", error);
    back(`error=polar&detail=${encodeURIComponent(String((error as Error).message).slice(0, 200))}`);
  }
  revalidatePath("/studio/discounts");
  back(`created=${encodeURIComponent(code)}`);
}

/** Deletes a code in Polar (asked to confirm first). */
export async function deleteDiscount(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") === "on" && /^[0-9a-f-]{36}$/i.test(id)) {
    try {
      await polarFetch(`/discounts/${id}`, { method: "DELETE" });
    } catch (error) {
      // DELETE answers 204 without a body; polarFetch only throws on !ok.
      console.error("[polar] delete discount failed", error);
      back("error=delete");
    }
  }
  revalidatePath("/studio/discounts");
  back("deleted=1");
}
