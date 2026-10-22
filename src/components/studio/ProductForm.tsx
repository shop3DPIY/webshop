import { saveProduct } from "@/lib/studio/actions";
import { COLLECTION_LIST } from "@/lib/config/colors";

const TRACK_GROUPS = [
  { track: "dolls" as const, label: "Dolls & Mini" },
  { track: "serious-games" as const, label: "Serious Games" },
];

interface ExistingProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  extra_categories: string[] | null;
  tags: string[];
  version: string;
  license_type: string;
  is_free: boolean;
  external_commerce_id: string | null;
  publication_status: string;
  dimensions: { width: number; depth: number; height: number } | null;
  print_settings: {
    layerHeightMm?: number;
    recommendedMaterials?: string[];
    supportsRequired?: boolean;
    instructions?: string;
    compatiblePrinters?: string[];
  } | null;
  download_files: { format: string; fileName: string }[];
  source_filename: string | null;
}

const FIELD = "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

export function ProductForm({ product }: { product?: ExistingProduct }) {
  const p = product;

  return (
    <form action={saveProduct} className="flex flex-col gap-8">
      {p && <input type="hidden" name="id" value={p.id} />}

      <section className="grid gap-4 sm:grid-cols-2">
        <label className={LABEL}>
          Title
          <input type="text" name="title" defaultValue={p?.title} required className={FIELD} />
        </label>
        <label className={LABEL}>
          Slug (leave empty to auto-generate)
          <input type="text" name="slug" defaultValue={p?.slug} className={FIELD} />
        </label>
      </section>

      <label className={LABEL}>
        Description
        <textarea
          name="description"
          defaultValue={p?.description}
          required
          rows={3}
          className={FIELD}
        />
      </label>

      <section className="grid gap-4 sm:grid-cols-3">
        <label className={LABEL}>
          Collection
          <select name="category" defaultValue={p?.category} required className={FIELD}>
            {TRACK_GROUPS.map((group) => (
              <optgroup key={group.track} label={group.label}>
                {COLLECTION_LIST.filter((c) => c.track === group.track).map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label="Unassigned">
              {COLLECTION_LIST.filter((c) => !c.track).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className={LABEL}>
          License
          <select name="licenseType" defaultValue={p?.license_type ?? "personal"} className={FIELD}>
            <option value="personal">Personal use</option>
            <option value="commercial">Commercial use</option>
            <option value="enterprise">Enterprise</option>
            <option value="free">Free</option>
          </select>
        </label>
        <label className={LABEL}>
          Status
          <select
            name="publicationStatus"
            defaultValue={p?.publication_status ?? "draft"}
            className={FIELD}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Also show in</legend>
        <p className="text-ink/60 text-xs">
          Extra collections this product appears in, next to the main Collection above. Only
          collections on the same track as the main one are saved (Serious Games stays separate).
        </p>
        {TRACK_GROUPS.map((group) => (
          <div key={group.track} className="flex flex-col gap-2">
            <span className="text-ink/60 text-xs font-semibold uppercase">{group.label}</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLLECTION_LIST.filter((c) => c.track === group.track).map((c) => (
                <label
                  key={c.slug}
                  className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="extraCategories"
                    value={c.slug}
                    defaultChecked={p?.extra_categories?.includes(c.slug)}
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <section className="grid gap-4 sm:grid-cols-3">
        <label className={LABEL}>
          Version
          <input type="text" name="version" defaultValue={p?.version ?? "1.0.0"} className={FIELD} />
        </label>
        <label className={LABEL}>
          Tags (comma separated)
          <input type="text" name="tags" defaultValue={p?.tags?.join(", ")} className={FIELD} />
        </label>
        <label className="flex items-end gap-2 pb-2.5 text-sm font-medium">
          <input type="checkbox" name="isFree" defaultChecked={p?.is_free} className="h-4 w-4" />
          Free design
        </label>
      </section>

      <label className={LABEL}>
        Internal notes — original filename in your design software (never shown to customers)
        <input
          type="text"
          name="sourceFilename"
          defaultValue={p?.source_filename ?? ""}
          className={FIELD}
          placeholder="e.g. storage-box-v2-final-ACTUALFINAL.f3d"
        />
      </label>

      <label className={LABEL}>
        Payhip product ID / permalink (leave empty until listed)
        <input
          type="text"
          name="externalCommerceId"
          defaultValue={p?.external_commerce_id ?? ""}
          className={FIELD}
        />
      </label>

      <h2 className="font-display text-lg font-semibold">Dimensions &amp; printing</h2>
      <section className="grid gap-4 sm:grid-cols-3">
        <label className={LABEL}>
          Width (mm)
          <input
            type="number"
            name="dimWidth"
            defaultValue={p?.dimensions?.width}
            className={FIELD}
          />
        </label>
        <label className={LABEL}>
          Depth (mm)
          <input
            type="number"
            name="dimDepth"
            defaultValue={p?.dimensions?.depth}
            className={FIELD}
          />
        </label>
        <label className={LABEL}>
          Height (mm)
          <input
            type="number"
            name="dimHeight"
            defaultValue={p?.dimensions?.height}
            className={FIELD}
          />
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <label className={LABEL}>
          Recommended layer height (mm)
          <input
            type="number"
            step="0.01"
            name="layerHeightMm"
            defaultValue={p?.print_settings?.layerHeightMm}
            className={FIELD}
          />
        </label>
        <label className={LABEL}>
          Recommended materials (comma separated)
          <input
            type="text"
            name="recommendedMaterials"
            defaultValue={p?.print_settings?.recommendedMaterials?.join(", ")}
            className={FIELD}
          />
        </label>
      </section>

      <label className={LABEL}>
        Compatible printers (comma separated)
        <input
          type="text"
          name="compatiblePrinters"
          defaultValue={p?.print_settings?.compatiblePrinters?.join(", ")}
          className={FIELD}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="supportsRequired"
          defaultChecked={p?.print_settings?.supportsRequired}
          className="h-4 w-4"
        />
        Supports required
      </label>

      <label className={LABEL}>
        Printing instructions — this is the explanation shown on the product page
        <textarea
          name="instructions"
          defaultValue={p?.print_settings?.instructions}
          rows={4}
          className={FIELD}
          placeholder="e.g. Print flat side down, 0.2mm layers, no supports needed, PLA or PETG recommended."
        />
      </label>

      <h2 className="font-display text-lg font-semibold">Files</h2>
      <p className="text-ink/60 -mt-4 text-sm">
        {p?.download_files && p.download_files.length > 0
          ? `Currently uploaded: ${p.download_files.map((f) => `${f.format} (${f.fileName})`).join(", ")}. Uploading a new file of the same format replaces it.`
          : "Upload at least one file. Stored privately — only entitled customers get a signed download link."}
      </p>
      <section className="grid gap-4 sm:grid-cols-2">
        <label className={LABEL}>
          STL file
          <input type="file" name="stlFile" accept=".stl" className={FIELD} />
        </label>
        <label className={LABEL}>
          3MF file
          <input type="file" name="threeMfFile" accept=".3mf" className={FIELD} />
        </label>
        <label className={LABEL}>
          ZIP file
          <input type="file" name="zipFile" accept=".zip" className={FIELD} />
        </label>
        <label className={LABEL}>
          Instructions PDF
          <input type="file" name="pdfFile" accept=".pdf" className={FIELD} />
        </label>
      </section>

      <label className={LABEL}>
        Product photo
        <input type="file" name="imageFile" accept="image/*" className={FIELD} />
      </label>

      <button
        type="submit"
        className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg transition-colors mt-4 w-fit rounded-full px-6 py-3 text-sm font-semibold"
      >
        {p ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
