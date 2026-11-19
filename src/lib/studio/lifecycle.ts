"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { trySyncProductToPolar } from "@/lib/commerce/polar/sync";
import { requireAdmin } from "./guard";
import { countOwners } from "./owners";
import { publicPath } from "./storage";
import { bundlesContaining } from "./bundles";

/**
 * A design's end of life, from Studio → Edit product.
 *
 * - Nobody owns it yet (no order, entitlement or free download): it can be
 *   deleted for good — row, files, photos and its Polar product.
 * - Someone owns it: it can only be taken offline ("archived"). It then
 *   disappears from the shop and from Polar checkouts, but buyers keep it
 *   in their library and can still download it.
 */

export async function archiveProduct(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const id = String(formData.get("id") ?? "");

  await admin
    .from("products")
    .update({ publication_status: "archived" })
    .eq("id", id);
  await trySyncProductToPolar(id);
  revalidatePath("/studio/products");
  redirect("/studio/products?tab=archived");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const id = String(formData.get("id") ?? "");
  if (formData.get("confirm") !== "on") {
    redirect(`/studio/products/${id}/edit?deleteError=confirm`);
  }

  // Re-checked here, not just in the UI: a sale may have come in since
  // the page loaded.
  if ((await countOwners(id)) > 0) {
    redirect(`/studio/products/${id}/edit?deleteError=owned`);
  }

  const { data: product } = await admin
    .from("products")
    .select("slug, download_files, images, timelapse_url")
    .eq("id", id)
    .single();
  if (!product) redirect("/studio/products");

  // Polar first (archive its products), while the row still knows them.
  await admin
    .from("products")
    .update({ publication_status: "archived" })
    .eq("id", id);
  await trySyncProductToPolar(id);

  const files = (product.download_files ?? [])
    .map((f: { storagePath?: string }) => f.storagePath)
    .filter(Boolean) as string[];
  const media = [
    ...(product.images ?? []).map((img: { src: string }) => img.src),
    product.timelapse_url,
  ]
    .filter(Boolean)
    .map((src: string) => publicPath(src, "product-images"))
    .filter(Boolean) as string[];

  // Plus anything left in the product's own folder (ingest uploads).
  for (const bucket of ["product-files", "product-images"] as const) {
    const { data } = await admin.storage.from(bucket).list(product.slug, {
      limit: 1000,
    });
    const inFolder = (data ?? []).map((f) => `${product.slug}/${f.name}`);
    const paths = [
      ...new Set([...(bucket === "product-files" ? files : media), ...inFolder]),
    ];
    if (paths.length > 0) await admin.storage.from(bucket).remove(paths);
  }

  // Take it out of any bundle it was in.
  for (const bundleId of await bundlesContaining(id)) {
    const { data: bundle } = await admin
      .from("products")
      .select("bundle_product_ids")
      .eq("id", bundleId)
      .single();
    await admin
      .from("products")
      .update({
        bundle_product_ids: ((bundle?.bundle_product_ids ?? []) as string[]).filter(
          (x) => x !== id,
        ),
      })
      .eq("id", bundleId);
  }

  await admin.from("products").delete().eq("id", id);
  revalidatePath("/studio/products");
  redirect("/studio/products?deleted=1");
}
