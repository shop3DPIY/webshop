"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Files, photos and timelapse for the Studio product form. Every file is
 * uploaded straight from the browser into Supabase Storage (the admin's
 * own session; storage policies allow admins) the moment it's picked —
 * the form itself only carries the resulting paths/URLs. Sending files
 * through the form would hit Next.js's 1 MB server-action limit and
 * Netlify's ~6 MB request limit.
 *
 * Saved by persistProduct (src/lib/studio/actions.ts) from the hidden
 * fields studioDownloads / studioImages / studioTimelapse.
 */

const MAX_BYTES = 50 * 1024 * 1024; // Supabase free-plan limit per file
const DOWNLOAD_FORMATS = [
  { format: "STL", accept: ".stl", label: "STL file" },
  { format: "3MF", accept: ".3mf", label: "3MF file" },
  { format: "ZIP", accept: ".zip", label: "ZIP file" },
  { format: "PDF", accept: ".pdf", label: "Instructions PDF" },
] as const;

const BUTTON =
  "border-line bg-mist hover:border-brand-purple hover:bg-brand-purple/45 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors";

type Download = { format: string; fileName: string; path: string };
type Status = { busy: boolean; error: string | null };

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

/** Uploads one file into Storage with the admin's own browser session. */
async function upload(bucket: "product-files" | "product-images", file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `${file.name} is ${Math.round(file.size / 1024 / 1024)} MB — the limit is 50 MB.`,
    );
  }
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase isn't configured.");
  const path = `studio/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  return {
    path,
    publicUrl: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,
  };
}

export function MediaFields({
  existingDownloads,
  existingImages,
  existingTimelapse,
}: {
  existingDownloads: { format: string; fileName: string }[];
  existingImages: { src: string; alt: string }[];
  existingTimelapse: string | null;
}) {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [images, setImages] = useState<string[]>(
    existingImages.map((i) => i.src),
  );
  const [timelapse, setTimelapse] = useState<string | null>(existingTimelapse);
  const [status, setStatus] = useState<Record<string, Status>>({});

  const setBusy = (key: string, busy: boolean, error: string | null = null) =>
    setStatus((s) => ({ ...s, [key]: { busy, error } }));

  async function onDownload(format: string, file: File | undefined) {
    if (!file) return;
    setBusy(format, true);
    try {
      const { path } = await upload("product-files", file);
      setDownloads((d) => [
        ...d.filter((x) => x.format !== format),
        { format, fileName: file.name, path },
      ]);
      setBusy(format, false);
    } catch (e) {
      setBusy(format, false, (e as Error).message);
    }
  }

  async function onPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy("photos", true);
    try {
      const added: string[] = [];
      for (const file of Array.from(files)) {
        if (/\.(heic|heif)$/i.test(file.name)) {
          throw new Error(`${file.name} is HEIC — export it as JPG first.`);
        }
        added.push((await upload("product-images", file)).publicUrl);
      }
      setImages((current) => [...current, ...added]);
      setBusy("photos", false);
    } catch (e) {
      setBusy("photos", false, (e as Error).message);
    }
  }

  async function onTimelapse(file: File | undefined) {
    if (!file) return;
    setBusy("timelapse", true);
    try {
      setTimelapse((await upload("product-images", file)).publicUrl);
      setBusy("timelapse", false);
    } catch (e) {
      setBusy("timelapse", false, (e as Error).message);
    }
  }

  const move = (index: number, delta: number) =>
    setImages((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const note = (key: string) => {
    const s = status[key];
    if (s?.busy) return <span className="text-ink/70 text-xs">Uploading…</span>;
    if (s?.error)
      return <span className="text-xs text-red-200">{s.error}</span>;
    return null;
  };

  const anyBusy = Object.values(status).some((s) => s.busy);

  return (
    <div className="flex flex-col gap-8">
      <input
        type="hidden"
        name="studioDownloads"
        value={JSON.stringify(downloads)}
      />
      <input type="hidden" name="studioImages" value={JSON.stringify(images)} />
      <input type="hidden" name="studioTimelapse" value={timelapse ?? ""} />
      {anyBusy && (
        // Blocks submitting the form until every upload has finished.
        <input
          tabIndex={-1}
          aria-hidden
          required
          value=""
          onChange={() => {}}
          ref={(el) =>
            el?.setCustomValidity("Wait until the uploads have finished.")
          }
          className="h-px w-px opacity-0"
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Files</h2>
        <p className="text-ink/60 text-sm">
          {existingDownloads.length > 0
            ? `Currently: ${existingDownloads.map((f) => `${f.format} (${f.fileName})`).join(", ")}. A new file of the same format replaces it.`
            : "Upload at least one file. Stored privately — only entitled customers get a download link."}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {DOWNLOAD_FORMATS.map(({ format, accept, label }) => {
            const picked = downloads.find((d) => d.format === format);
            return (
              <div
                key={format}
                className="flex flex-col gap-1.5 text-sm font-medium"
              >
                <span className="pl-4">{label}</span>
                <input
                  type="file"
                  accept={accept}
                  onChange={(e) => onDownload(format, e.target.files?.[0])}
                  className="border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm"
                />
                {note(format) ??
                  (picked && (
                    <span className="text-ink/70 pl-4 text-xs">
                      ✓ {picked.fileName} uploaded
                    </span>
                  ))}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Photos</h2>
        <p className="text-ink/60 text-sm">
          The first photo is the cover. Use the arrows to reorder, × to remove.
          JPG, PNG or WebP.
        </p>
        {images.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
            {images.map((src, i) => (
              <div
                key={src}
                className="flex flex-col gap-2 rounded-2xl p-2 glass"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="w-12 shrink-0 text-xs font-semibold">
                    {i === 0 ? "Cover" : `#${i + 1}`}
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className={BUTTON}
                      aria-label="Move left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1}
                      className={BUTTON}
                      aria-label="Move right"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImages((list) => list.filter((x) => x !== src))
                      }
                      className={BUTTON}
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => {
            void onPhotos(e.target.files);
            e.target.value = "";
          }}
          className="border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm"
        />
        {note("photos")}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Timelapse</h2>
        <p className="text-ink/60 text-sm">
          One video, shown on the product page. MP4 works best; max 50 MB.
        </p>
        {timelapse && (
          <div className="flex flex-col items-start gap-2">
            <video
              src={timelapse}
              controls
              muted
              playsInline
              preload="metadata"
              className="w-full max-w-md rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setTimelapse(null)}
              className={BUTTON}
            >
              × Remove timelapse
            </button>
          </div>
        )}
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={(e) => {
            void onTimelapse(e.target.files?.[0]);
            e.target.value = "";
          }}
          className="border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm"
        />
        {note("timelapse")}
      </section>
    </div>
  );
}
