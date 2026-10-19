"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./guard";

/**
 * All admin writes go through this file — nowhere else touches the
 * `products` table for writes. persistProduct() is the shared core used by
 * both the Studio form (saveProduct, session-authenticated via
 * requireAdmin) and the local ingest script's API route
 * (src/app/api/studio/ingest/route.ts, shared-secret-authenticated) — both
 * callers have already verified the request is trusted before calling it,
 * so it writes via the admin client (bypasses RLS) rather than depending
 * on a user session existing.
 */

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function uploadIfPresent(
  bucket: "product-files" | "product-images",
  slug: string,
  file: FormDataEntryValue | null,
) {
  if (!(file instanceof File) || file.size === 0) return null;

  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");

  const path = `${slug}/${Date.now()}-${file.name}`;
  const { error } = await admin.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  return path;
}

/**
 * Core product writer — assumes the caller has already authorized the
 * request. Returns the product id so callers can redirect, respond with
 * JSON, etc. as appropriate for their own context.
 */
export async function persistProduct(formData: FormData): Promise<{ id: string }> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");

  const id = String(formData.get("id") ?? "");
  const titleInput = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "") || slugify(titleInput);

  const existing = id
    ? (await admin.from("products").select("download_files, images").eq("id", id).single())
        .data
    : null;

  const downloadFiles: { format: string; fileName: string; storagePath: string }[] =
    existing?.download_files ?? [];

  for (const [format, field] of [
    ["STL", "stlFile"],
    ["3MF", "threeMfFile"],
    ["ZIP", "zipFile"],
    ["PDF", "pdfFile"],
  ] as const) {
    const file = formData.get(field);
    const path = await uploadIfPresent("product-files", slug, file);
    if (path && file instanceof File) {
      const next = downloadFiles.filter((f) => f.format !== format);
      next.push({ format, fileName: file.name, storagePath: path });
      downloadFiles.length = 0;
      downloadFiles.push(...next);
    }
  }

  let images = existing?.images ?? [];
  const imagePath = await uploadIfPresent("product-images", slug, formData.get("imageFile"));
  if (imagePath) {
    const publicUrl = admin.storage.from("product-images").getPublicUrl(imagePath).data.publicUrl;
    if (publicUrl) images = [{ src: publicUrl, alt: titleInput }];
  }

  const dimensions =
    formData.get("dimWidth") && formData.get("dimDepth") && formData.get("dimHeight")
      ? {
          width: Number(formData.get("dimWidth")),
          depth: Number(formData.get("dimDepth")),
          height: Number(formData.get("dimHeight")),
        }
      : null;

  const printSettings = {
    layerHeightMm: formData.get("layerHeightMm")
      ? Number(formData.get("layerHeightMm"))
      : undefined,
    recommendedMaterials: splitList(formData.get("recommendedMaterials")),
    supportsRequired: formData.get("supportsRequired") === "on",
    instructions: String(formData.get("instructions") ?? "") || undefined,
    compatiblePrinters: splitList(formData.get("compatiblePrinters")),
  };

  const payload = {
    slug,
    title: titleInput,
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") ?? ""),
    tags: splitList(formData.get("tags")),
    images,
    download_files: downloadFiles,
    dimensions,
    print_settings: printSettings,
    version: String(formData.get("version") ?? "1.0.0"),
    license_type: String(formData.get("licenseType") ?? "personal"),
    is_free: formData.get("isFree") === "on",
    external_commerce_id: String(formData.get("externalCommerceId") ?? "") || null,
    publication_status: String(formData.get("publicationStatus") ?? "draft"),
    source_filename: String(formData.get("sourceFilename") ?? "") || null,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await admin.from("products").update(payload).eq("id", id);
    if (error) throw error;
    revalidatePath("/studio/products");
    return { id };
  }

  const { data, error } = await admin.from("products").insert(payload).select("id").single();
  if (error) throw error;
  revalidatePath("/studio/products");
  return { id: data.id };
}

/** Studio form action — session-authenticated via requireAdmin(). */
export async function saveProduct(formData: FormData) {
  await requireAdmin();
  await persistProduct(formData);
  redirect("/studio/products");
}
