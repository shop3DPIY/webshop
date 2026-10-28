"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isEmail, upsertSubscriber } from "@/lib/newsletter/server";
import { grantFreeDownload, sendFreeDownloadMail } from "./server";

export type FreeDownloadState = {
  status: "idle" | "sent" | "invalid" | "error";
};

/**
 * The form on a free design's page: an email address is required (the
 * download link is mailed to it); joining the newsletter is an optional
 * checkbox. Signed-in visitors also get the design in their library.
 */
export async function requestFreeDownload(
  _prev: FreeDownloadState,
  formData: FormData,
): Promise<FreeDownloadState> {
  if (formData.get("website")) return { status: "sent" }; // honeypot
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "en") === "nl" ? "nl" : "en";
  const productId = String(formData.get("productId") ?? "");
  if (!isEmail(email)) return { status: "invalid" };
  const wantsNewsletter = formData.get("newsletter") === "on";

  const admin = createAdminClient();
  if (!admin) return { status: "error" };
  const { data: product } = await admin
    .from("products")
    .select("id, title, title_nl, download_files, is_free, publication_status")
    .eq("id", productId)
    .maybeSingle();
  if (!product?.is_free || product.publication_status !== "published") {
    return { status: "error" };
  }

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const subscriber = wantsNewsletter
    ? await upsertSubscriber({
        email,
        locale,
        source: "free_download",
        ...(user?.email?.toLowerCase() === email && { userId: user.id }),
      })
    : null;
  const token = await grantFreeDownload(email, product.id);
  if (!token || (subscriber && !subscriber.ok)) return { status: "error" };

  if (user) {
    await admin
      .from("entitlements")
      .upsert(
        { customer_id: user.id, product_id: product.id },
        { onConflict: "customer_id,product_id", ignoreDuplicates: true },
      );
  }

  const formats = (product.download_files as { format: string; storagePath?: string }[])
    .filter((f) => f.storagePath)
    .map((f) => f.format);
  const sent = await sendFreeDownloadMail({
    email,
    locale,
    title: (locale === "nl" && product.title_nl) || product.title,
    formats,
    token,
    newsletterToken: subscriber?.token ?? null,
  });
  return { status: sent.ok ? "sent" : "error" };
}
