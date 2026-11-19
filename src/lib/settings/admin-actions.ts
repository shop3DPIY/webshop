"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/studio/guard";
import { isTextDoc } from "@/content/legal";
import { BUSINESS_FIELDS } from "./business";

/** Footer, contact and legal pages use these everywhere: refresh them all. */
function refreshSite() {
  revalidatePath("/", "layout");
}

/** Studio → Settings: business details (KvK, VAT, address, IBAN, email). */
export async function saveBusinessDetails(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const business = Object.fromEntries(
    BUSINESS_FIELDS.map((key) => [key, String(formData.get(key) ?? "").trim().slice(0, 200)]),
  );
  if (business.vatId) business.vatId = business.vatId.replace(/\s+/g, "").toUpperCase();
  if (business.iban) business.iban = business.iban.replace(/\s+/g, "").toUpperCase();
  const { error } = await admin
    .from("site_settings")
    .upsert({ id: 1, business, updated_at: new Date().toISOString() });
  if (error) redirect(`/studio/settings?error=${encodeURIComponent(error.message.slice(0, 200))}`);
  refreshSite();
  redirect("/studio/settings?saved=1");
}

/** Studio → Legal → a page: save the English and Dutch text. */
export async function saveLegalDocument(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const slug = String(formData.get("slug") ?? "");
  if (!isTextDoc(slug)) redirect("/studio/legal");
  const field = (name: string, max: number) =>
    String(formData.get(name) ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
  const row = {
    slug,
    title_en: field("title_en", 200),
    body_en: field("body_en", 100_000),
    title_nl: field("title_nl", 200),
    body_nl: field("body_nl", 100_000),
    updated_at: new Date().toISOString(),
  };
  if (!row.title_en || !row.body_en || !row.title_nl || !row.body_nl) {
    redirect(`/studio/legal/${slug}?error=empty`);
  }
  const { error } = await admin.from("legal_documents").upsert(row);
  if (error) redirect(`/studio/legal/${slug}?error=${encodeURIComponent(error.message.slice(0, 200))}`);
  refreshSite();
  redirect(`/studio/legal/${slug}?saved=1`);
}

/** Back to the default text from the code (asked to confirm first). */
export async function resetLegalDocument(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const slug = String(formData.get("slug") ?? "");
  if (!isTextDoc(slug)) redirect("/studio/legal");
  if (formData.get("confirm") === "on") {
    await admin.from("legal_documents").delete().eq("slug", slug);
    refreshSite();
  }
  redirect(`/studio/legal/${slug}?reset=1`);
}
