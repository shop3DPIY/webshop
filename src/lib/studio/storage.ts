import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Keeps Storage free of files no product uses any more:
 * - removeReplacedMedia: after a save, the photos/timelapse/files that
 *   were removed or replaced in the form;
 * - sweepOrphanUploads: uploads Studio made for a form that was never
 *   saved (the browser uploads the moment a file is picked).
 */

/** Pulls the "<path>" out of a Supabase public storage URL of `bucket`. */
export function publicPath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

interface MediaRow {
  images?: { src: string }[] | null;
  timelapse_url?: string | null;
  download_files?: { storagePath?: string }[] | null;
}

function mediaPaths(row: MediaRow | null | undefined) {
  const images = [
    ...(row?.images ?? []).map((img) => img.src),
    row?.timelapse_url ?? null,
  ]
    .filter((src): src is string => Boolean(src))
    .map((src) => publicPath(src, "product-images"))
    .filter((p): p is string => Boolean(p));
  const files = (row?.download_files ?? [])
    .map((f) => f.storagePath)
    .filter((p): p is string => Boolean(p));
  return { images, files };
}

export async function removeReplacedMedia(before: MediaRow | null, after: MediaRow) {
  if (!before) return;
  const admin = createAdminClient();
  if (!admin) return;
  const old = mediaPaths(before);
  const now = mediaPaths(after);
  const goneImages = old.images.filter((p) => !now.images.includes(p));
  const goneFiles = old.files.filter((p) => !now.files.includes(p));
  if (goneImages.length > 0) await admin.storage.from("product-images").remove(goneImages);
  if (goneFiles.length > 0) await admin.storage.from("product-files").remove(goneFiles);
}

/** Unsaved uploads older than this are swept (a form can stay open a while). */
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

export async function sweepOrphanUploads() {
  const admin = createAdminClient();
  if (!admin) return;
  const { data: rows } = await admin
    .from("products")
    .select("images, timelapse_url, download_files");
  const used = { images: new Set<string>(), files: new Set<string>() };
  for (const row of (rows ?? []) as MediaRow[]) {
    const p = mediaPaths(row);
    p.images.forEach((x) => used.images.add(x));
    p.files.forEach((x) => used.files.add(x));
  }

  const cutoff = Date.now() - ORPHAN_AGE_MS;
  for (const [bucket, inUse] of [
    ["product-images", used.images],
    ["product-files", used.files],
  ] as const) {
    const { data } = await admin.storage.from(bucket).list("studio", { limit: 1000 });
    const orphans = (data ?? [])
      .filter((f) => f.id && new Date(f.created_at ?? Date.now()).getTime() < cutoff)
      .map((f) => `studio/${f.name}`)
      .filter((path) => !inUse.has(path));
    if (orphans.length > 0) await admin.storage.from(bucket).remove(orphans);
  }
}
