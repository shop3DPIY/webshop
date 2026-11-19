"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/studio/guard";
import { MAKES_BUCKET } from "./server";

async function revalidateProduct(productId: string) {
  const admin = createAdminClient();
  const { data } = await admin!
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (data?.slug) {
    revalidatePath(`/product/${data.slug}`);
    revalidatePath(`/nl/product/${data.slug}`);
  }
}

/** Studio → Makes: show a customer's photo on the product page. */
export async function approveMake(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const id = String(formData.get("id") ?? "");
  const { data } = await admin
    .from("customer_makes")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id)
    .select("product_id")
    .maybeSingle();
  if (data) await revalidateProduct(data.product_id);
  revalidatePath("/studio/makes");
  redirect("/studio/makes");
}

/** Rejecting or removing: deletes the row and the photo (confirmed first). */
export async function deleteMake(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  if (formData.get("confirm") === "on") {
    const id = String(formData.get("id") ?? "");
    const { data } = await admin
      .from("customer_makes")
      .delete()
      .eq("id", id)
      .select("product_id, image_path")
      .maybeSingle();
    if (data) {
      await admin.storage.from(MAKES_BUCKET).remove([data.image_path]);
      await revalidateProduct(data.product_id);
    }
  }
  revalidatePath("/studio/makes");
  redirect("/studio/makes");
}
