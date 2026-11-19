"use server";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { contactInbox, isMailConfigured, sendMail } from "@/lib/mail/send";
import { emailLayout, escapeHtml } from "@/lib/mail/template";
import { MAKES_BUCKET } from "./server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The browser shrinks photos to well under this (MakeShare.tsx). */
const MAX_BYTES = 950 * 1024;
/** Waiting for review at once, per person and design. */
const MAX_PENDING = 3;

const siteUrl = () => (process.env.SITE_URL || "https://3dpiy.com").replace(/\/$/, "");

async function signedInOwner(productId: string) {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user || !UUID_RE.test(productId)) return { user, owns: false };
  const { data } = await supabase!
    .from("entitlements")
    .select("product_id")
    .eq("customer_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();
  return { user, owns: !!data };
}

/** "Share your print": may this visitor share a photo of this design? */
export async function makeEligibility(
  productId: string,
): Promise<{ signedIn: boolean; owns: boolean; name: string }> {
  const { user, owns } = await signedInOwner(productId);
  if (!user) return { signedIn: false, owns: false, name: "" };
  const supabase = await createClient();
  const { data: profile } = await supabase!
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  return {
    signedIn: true,
    owns,
    name: (profile?.full_name ?? "").trim().split(/\s+/)[0] ?? "",
  };
}

export type MakeResult = { status: "sent" | "invalid" | "forbidden" | "limit" | "error" };

export async function submitMake(formData: FormData): Promise<MakeResult> {
  const productId = String(formData.get("productId") ?? "");
  const { user, owns } = await signedInOwner(productId);
  if (!user || !owns) return { status: "forbidden" };

  const photo = formData.get("photo");
  const displayName = String(formData.get("displayName") ?? "").trim().slice(0, 40);
  const caption = String(formData.get("caption") ?? "").trim().slice(0, 300);
  if (
    formData.get("consent") !== "on" ||
    !(photo instanceof File) ||
    photo.size === 0 ||
    photo.size > MAX_BYTES ||
    photo.type !== "image/jpeg"
  ) {
    return { status: "invalid" };
  }

  const admin = createAdminClient();
  if (!admin) return { status: "error" };
  const { count } = await admin
    .from("customer_makes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("status", "pending");
  if ((count ?? 0) >= MAX_PENDING) return { status: "limit" };

  const path = `${productId}/${randomUUID()}.jpg`;
  const { error: uploadError } = await admin.storage
    .from(MAKES_BUCKET)
    .upload(path, photo, { contentType: "image/jpeg" });
  if (uploadError) {
    console.error("[makes] upload failed", uploadError);
    return { status: "error" };
  }
  const { error } = await admin.from("customer_makes").insert({
    product_id: productId,
    user_id: user.id,
    display_name: displayName,
    caption,
    image_path: path,
  });
  if (error) {
    await admin.storage.from(MAKES_BUCKET).remove([path]);
    console.error("[makes] insert failed", error);
    return { status: "error" };
  }

  if (isMailConfigured()) {
    const { data: product } = await admin
      .from("products")
      .select("title")
      .eq("id", productId)
      .maybeSingle();
    await sendMail({
      to: contactInbox(),
      subject: `[3DPIY make] Nieuwe foto van ${product?.title ?? "een ontwerp"}`,
      text: `${displayName || user.email} deelde een foto van ${product?.title}.\n\n${caption}\n\nKeuren: ${siteUrl()}/studio/makes`,
      html: emailLayout({
        heading: "Nieuwe klantfoto",
        bodyHtml: `<p style="margin:0 0 16px">${escapeHtml(displayName || user.email || "")} deelde een foto van <b>${escapeHtml(product?.title ?? "")}</b>.</p>${caption ? `<p style="margin:0 0 16px">${escapeHtml(caption)}</p>` : ""}<p style="margin:0"><a href="${siteUrl()}/studio/makes" style="color:#8c52ff">Keuren in Studio</a></p>`,
      }),
    }).catch((e) => console.error("[makes] mail failed", e));
  }
  return { status: "sent" };
}
