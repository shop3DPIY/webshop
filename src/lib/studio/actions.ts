"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { COLLECTIONS, type CollectionSlug } from "@/lib/config/colors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PRICE_TIERS,
  calculatePrices,
  tierCents,
  validateSettings,
  withDefaults,
  type Complexity,
  type PriceTier,
  type PricingSettings,
} from "@/lib/pricing/calculate";
import {
  COLLECTION_NAMES,
  getPricingSettings,
  priceColumns,
  productPricingFromForm,
  storedPrices,
} from "@/lib/pricing/settings";
import { generateProductText, type ProductText } from "@/lib/ai/productText";
import { trySyncProductToPolar } from "@/lib/commerce/polar/sync";
import { requireAdmin } from "./guard";
import { getUpdateRecipients } from "@/lib/updates/server";

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
 * Extra collections from the form's checkboxes, limited to the primary
 * category's track (a product can't be both personal- and commercial-
 * licensed) and never repeating the primary category itself.
 */
function extraCategoriesFor(
  formData: FormData,
  category: string,
): CollectionSlug[] {
  const primary = COLLECTIONS[category as CollectionSlug];
  if (!primary) return [];
  return formData
    .getAll("extraCategories")
    .map(String)
    .filter((slug): slug is CollectionSlug => {
      const c = COLLECTIONS[slug as CollectionSlug];
      return !!c && slug !== category && c.track === primary.track;
    });
}

/** A storage path we issued ourselves: "<folder>/<stamp>-<name>", nothing else. */
const STORAGE_PATH_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

/**
 * Storage paths of files the ingest script uploaded directly (JSON form
 * fields uploadedDownload / uploadedImages / uploadedTimelapse). Anything
 * that isn't a path shaped like the ones upload-urls hands out is ignored.
 */
function parseUploaded(formData: FormData) {
  const json = <T>(key: string): T | null => {
    try {
      const raw = formData.get(key);
      return raw ? (JSON.parse(String(raw)) as T) : null;
    } catch {
      return null;
    }
  };
  const ok = (p: unknown): p is string =>
    typeof p === "string" && STORAGE_PATH_RE.test(p);

  const download = json<{ fileName: string; path: string }>("uploadedDownload");
  const images = json<string[]>("uploadedImages") ?? [];
  const timelapse = String(formData.get("uploadedTimelapse") ?? "");
  return {
    download:
      download && ok(download.path) && typeof download.fileName === "string"
        ? download
        : null,
    images: Array.isArray(images) ? images.filter(ok) : [],
    timelapse: ok(timelapse) ? timelapse : null,
  };
}

/** Public URLs of files in our own product-images bucket — nothing else is accepted. */
function isOwnImageUrl(url: unknown): url is string {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/`;
  return typeof url === "string" && url.startsWith(base) && !url.includes("..");
}

/**
 * The Studio form's media fields (MediaFields.tsx). Each is only applied
 * when present, so other callers (the ingest route) are unaffected.
 */
function parseStudioMedia(formData: FormData) {
  const json = <T>(key: string): T | undefined => {
    const raw = formData.get(key);
    if (raw === null) return undefined;
    try {
      return JSON.parse(String(raw)) as T;
    } catch {
      return undefined;
    }
  };
  const downloads = (
    json<{ format: string; fileName: string; path: string }[]>(
      "studioDownloads",
    ) ?? []
  ).filter(
    (d) =>
      ["STL", "3MF", "ZIP", "PDF"].includes(d?.format) &&
      typeof d.fileName === "string" &&
      STORAGE_PATH_RE.test(d.path),
  );
  const imageList = json<unknown[]>("studioImages");
  const rawTimelapse = formData.get("studioTimelapse");
  let timelapse: string | null | undefined;
  if (rawTimelapse !== null) {
    const value = String(rawTimelapse);
    timelapse = value === "" ? null : isOwnImageUrl(value) ? value : undefined;
  }
  return {
    downloads,
    images: Array.isArray(imageList)
      ? imageList.filter(isOwnImageUrl)
      : undefined,
    timelapse,
  };
}

/**
 * Core product writer — assumes the caller has already authorized the
 * request. Returns the product id so callers can redirect, respond with
 * JSON, etc. as appropriate for their own context.
 */
export async function persistProduct(
  formData: FormData,
): Promise<{ id: string; commerceError: string | null }> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");

  const id = String(formData.get("id") ?? "");
  const titleInput = String(formData.get("title") ?? "");
  const slug = String(formData.get("slug") ?? "") || slugify(titleInput);

  const existing = id
    ? (await admin.from("products").select("*").eq("id", id).single()).data
    : null;

  const downloadFiles: {
    format: string;
    fileName: string;
    storagePath: string;
  }[] = existing?.download_files ?? [];

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
  const imagePath = await uploadIfPresent(
    "product-images",
    slug,
    formData.get("imageFile"),
  );
  if (imagePath) {
    const publicUrl = admin.storage
      .from("product-images")
      .getPublicUrl(imagePath).data.publicUrl;
    if (publicUrl) images = [{ src: publicUrl, alt: titleInput }];
  }

  // Files the ingest script already PUT into Storage itself (via
  // /api/studio/ingest/upload-urls — too big to pass through the site).
  const uploaded = parseUploaded(formData);
  if (uploaded.download) {
    const ext =
      uploaded.download.fileName.split(".").pop()?.toUpperCase() ?? "ZIP";
    const format = ext === "STL" || ext === "3MF" ? ext : "ZIP";
    const next = downloadFiles.filter((f) => f.format !== format);
    next.push({
      format,
      fileName: uploaded.download.fileName,
      storagePath: uploaded.download.path,
    });
    downloadFiles.length = 0;
    downloadFiles.push(...next);
  }
  if (uploaded.images.length > 0) {
    images = uploaded.images.map((path) => ({
      src: admin.storage.from("product-images").getPublicUrl(path).data
        .publicUrl,
      alt: titleInput,
    }));
  }
  let timelapseUrl: string | null = uploaded.timelapse
    ? admin.storage.from("product-images").getPublicUrl(uploaded.timelapse).data
        .publicUrl
    : (existing?.timelapse_url ?? null);

  // Studio form (MediaFields.tsx): files were uploaded from the browser;
  // the form sends new downloads, the full ordered photo list and the
  // timelapse URL ("" = removed).
  const studio = parseStudioMedia(formData);
  for (const d of studio.downloads) {
    const next = downloadFiles.filter((f) => f.format !== d.format);
    next.push({ format: d.format, fileName: d.fileName, storagePath: d.path });
    downloadFiles.length = 0;
    downloadFiles.push(...next);
  }
  if (studio.images)
    images = studio.images.map((src) => ({ src, alt: titleInput }));
  if (studio.timelapse !== undefined) timelapseUrl = studio.timelapse;

  const dimensions =
    formData.get("dimWidth") &&
    formData.get("dimDepth") &&
    formData.get("dimHeight")
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

  const category = String(formData.get("category") ?? "");
  const pricing = productPricingFromForm(
    formData,
    category,
    await getPricingSettings(),
    existing ? storedPrices(existing) : undefined,
  );

  const payload = {
    slug,
    title: titleInput,
    description: String(formData.get("description") ?? ""),
    ...(formData.has("titleNl") && {
      title_nl: String(formData.get("titleNl") ?? "").trim() || null,
    }),
    ...(formData.has("descriptionNl") && {
      description_nl:
        String(formData.get("descriptionNl") ?? "").trim() || null,
    }),
    category,
    extra_categories: extraCategoriesFor(formData, category),
    tags: splitList(formData.get("tags")),
    images,
    timelapse_url: timelapseUrl,
    download_files: downloadFiles,
    dimensions,
    print_settings: printSettings,
    version: String(formData.get("version") ?? "1.0.0"),
    license_type: String(formData.get("licenseType") ?? "personal"),
    is_free: formData.get("isFree") === "on",
    publication_status: String(formData.get("publicationStatus") ?? "draft"),
    source_filename: String(formData.get("sourceFilename") ?? "") || null,
    ...pricing,
    updated_at: new Date().toISOString(),
  };

  let savedId = id;
  if (id) {
    const { error } = await admin.from("products").update(payload).eq("id", id);
    if (error) throw error;
  } else {
    const { data, error } = await admin
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    savedId = data.id;
  }

  // List/update the design with the commerce provider (Polar) — never
  // blocks the save; a failure is shown in Studio and retried next save.
  const commerceError = await trySyncProductToPolar(savedId);
  revalidatePath("/studio/products");
  return { id: savedId, commerceError };
}

/** Studio form action — session-authenticated via requireAdmin(). */
export async function saveProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const before = id
    ? (await createAdminClient()?.from("products").select("version").eq("id", id).single())?.data
    : null;

  const { id: savedId, commerceError } = await persistProduct(formData);
  if (commerceError) {
    redirect(`/studio/products?commerceError=${encodeURIComponent(commerceError.slice(0, 300))}`);
  }

  // A new version of a design people own: offer to tell them (nothing is
  // sent until "Send" on that page — see src/lib/updates).
  const version = String(formData.get("version") ?? "");
  if (before && version && before.version !== version) {
    if ((await getUpdateRecipients(savedId)).length > 0) {
      redirect(`/studio/products/${savedId}/notify`);
    }
  }
  redirect("/studio/products");
}

/** Studio → Products → "Sync with Polar": (re)lists every product. */
export async function syncAllProductsToPolar() {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");

  const { data: products, error } = await admin.from("products").select("id");
  if (error) throw error;

  const failures: string[] = [];
  for (const p of products ?? []) {
    const message = await trySyncProductToPolar(p.id);
    if (message) failures.push(message);
  }

  revalidatePath("/studio/products");
  redirect(
    failures.length > 0
      ? `/studio/products?commerceError=${encodeURIComponent(`${failures.length} product(s) failed: ${failures[0].slice(0, 200)}`)}`
      : `/studio/products?synced=${products?.length ?? 0}`,
  );
}

/**
 * Studio → Pricing. Takes the whole settings object (as JSON,
 * already parsed from Dutch notation on the client), re-validates it here
 * and stores it. Existing product prices are deliberately left alone —
 * see applyRecalculation for that.
 */
export async function savePricingSettings(
  json: string,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { ok: false, errors: ["Supabase is not configured"] };

  let settings: PricingSettings;
  try {
    settings = withDefaults(JSON.parse(json) as Partial<PricingSettings>);
  } catch {
    return { ok: false, errors: ["Invalid input"] };
  }
  const errors = validateSettings(settings, COLLECTION_NAMES);
  if (errors.length > 0) return { ok: false, errors };

  const { error } = await admin
    .from("pricing_settings")
    .upsert({ id: 1, settings, updated_at: new Date().toISOString() });
  if (error) return { ok: false, errors: [error.message] };

  revalidatePath("/studio/pricing");
  return { ok: true };
}

/**
 * Studio → Recalculate prices: for each selected product, recalculate
 * with the current settings and make the calculated prices the chosen
 * ones (clearing any hand-typed overrides on that product).
 */
export async function applyRecalculation(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");

  const ids = formData.getAll("productId").map(String);
  if (ids.length === 0) redirect("/studio/pricing/recalculate");

  const settings = await getPricingSettings();
  const { data: products, error } = await admin
    .from("products")
    .select("id, category, complexity, is_set, part_count, includes_step")
    .in("id", ids);
  if (error) throw error;

  for (const p of products ?? []) {
    const result = calculatePrices(settings, {
      category: (p.category in COLLECTIONS
        ? p.category
        : "other") as CollectionSlug,
      complexity: p.complexity as Complexity,
      isSet: p.is_set,
      partCount: p.part_count,
      includesStep: p.includes_step,
    });
    const calc = Object.fromEntries(
      PRICE_TIERS.map((tier) => [tier, tierCents(result, tier)]),
    ) as Record<PriceTier, number>;
    const { error: updateError } = await admin
      .from("products")
      .update({
        ...priceColumns(calc, calc),
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    if (updateError) throw updateError;
    await trySyncProductToPolar(p.id);
  }

  revalidatePath("/studio/products");
  redirect(`/studio/pricing/recalculate?updated=${products?.length ?? 0}`);
}

/** Studio's "Text with AI" button — house-style English + Dutch texts. */
export async function generateProductTextAction(input: {
  title?: string;
  description?: string;
  categoryName?: string;
}): Promise<{ ok: true; text: ProductText } | { ok: false; error: string }> {
  await requireAdmin();
  try {
    const text = await generateProductText({
      title: input.title?.slice(0, 300),
      description: input.description?.slice(0, 4000),
      categoryName: input.categoryName?.slice(0, 100),
    });
    return { ok: true, text };
  } catch (error) {
    console.error("[studio] text with AI failed", error);
    return {
      ok: false,
      error:
        "The AI couldn't write the texts right now. Try again in a moment.",
    };
  }
}
