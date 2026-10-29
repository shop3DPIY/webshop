import { formatCompatible } from "@/lib/compatible";
import { AlsoShowIn } from "./AlsoShowIn";
import { saveProduct } from "@/lib/studio/actions";
import { COLLECTION_LIST, type CollectionSlug } from "@/lib/config/colors";
import type {
  Complexity,
  PriceTier,
  PricingSettings,
} from "@/lib/pricing/calculate";
import { PricingFields } from "./PricingFields";
import { MediaFields } from "./MediaFields";
import { ProductTextFields } from "./ProductTextFields";

const TRACK_GROUPS = [
  { track: "dolls" as const, label: "Dolls & Mini" },
  { track: "business" as const, label: "Business" },
];

interface ExistingProduct {
  id: string;
  slug: string;
  title: string;
  description: string;
  title_nl: string | null;
  description_nl: string | null;
  category: string;
  extra_categories: string[] | null;
  tags: string[];
  version: string;
  license_type: string;
  is_free: boolean;
  commerce_product_ids: Partial<Record<PriceTier, string>> | null;
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
  images: { src: string; alt: string }[] | null;
  timelapse_url: string | null;
  source_filename: string | null;
  external_links: { compatible?: { label: string; url?: string }[] } | null;
  complexity: Complexity;
  is_set: boolean;
  part_count: number;
  includes_step: boolean;
  price_cents: number | null;
  price_small_cents: number | null;
  price_unlimited_cents: number | null;
  price_overrides: PriceTier[] | null;
}

const FIELD =
  "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

/** ⓘ with the explanation on hover (and for screen readers). */
function Info({ text }: { text: string }) {
  return (
    <span
      title={text}
      aria-label={text}
      className="text-ink/60 hover:text-ink cursor-help font-normal"
    >
      ⓘ
    </span>
  );
}

export function ProductForm({
  product,
  pricingSettings,
  aiAvailable,
}: {
  product?: ExistingProduct;
  pricingSettings: PricingSettings;
  /** ANTHROPIC_API_KEY is set, so "Text with AI" works */
  aiAvailable: boolean;
}) {
  const p = product;
  // Same default the Collection select shows for a new product (its first option).
  const initialCategory = (p?.category ??
    COLLECTION_LIST.find((c) => c.track === TRACK_GROUPS[0].track)!
      .slug) as CollectionSlug;

  return (
    <form action={saveProduct} className="flex flex-col gap-8">
      {p && <input type="hidden" name="id" value={p.id} />}

      {/* Two columns on wide screens: what the design is (texts, where
          it shows, files) on the left, prices and print details on the
          right — each group on its own tile so it stays easy to scan. */}
      <div className="grid items-start gap-8 xl:grid-cols-2">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 rounded-3xl p-6 glass">
            <ProductTextFields
              initial={{
                title: p?.title ?? "",
                description: p?.description ?? "",
                titleNl: p?.title_nl ?? "",
                descriptionNl: p?.description_nl ?? "",
              }}
              slug={p?.slug}
              collectionNames={Object.fromEntries(
                COLLECTION_LIST.map((c) => [c.slug, c.name]),
              )}
              initialCategory={initialCategory}
              aiAvailable={aiAvailable}
            />

            <section className="grid gap-4 sm:grid-cols-3">
              <label className={LABEL}>
                Collection
                <select
                  name="category"
                  defaultValue={initialCategory}
                  required
                  className={FIELD}
                >
                  {TRACK_GROUPS.map((group) => (
                    <optgroup key={group.track} label={group.label}>
                      {COLLECTION_LIST.filter(
                        (c) => c.track === group.track,
                      ).map((c) => (
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
                <select
                  name="licenseType"
                  defaultValue={p?.license_type ?? "personal"}
                  className={FIELD}
                >
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
          </div>
          <div className="flex flex-col gap-6 rounded-3xl p-6 glass">
            <MediaFields
              existingDownloads={p?.download_files ?? []}
              existingImages={p?.images ?? []}
              existingTimelapse={p?.timelapse_url ?? null}
            />
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 rounded-3xl p-6 glass">
            <PricingFields
              settings={pricingSettings}
              initialCategory={initialCategory}
              existing={
                p && {
                  complexity: p.complexity,
                  isSet: p.is_set,
                  partCount: p.part_count,
                  includesStep: p.includes_step,
                  chosen: {
                    personal: p.price_cents,
                    small: p.price_small_cents,
                    unlimited: p.price_unlimited_cents,
                  },
                  overridden: p.price_overrides ?? [],
                }
              }
            />
          </div>
          <div className="flex flex-col gap-6 rounded-3xl p-6 glass">
            <h2 className="font-display text-lg font-semibold">
              Dimensions &amp; printing
            </h2>
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
                <span>
                  Recommended materials{" "}
                  <Info text="Comma separated, e.g. PLA, PETG" />
                </span>
                <input
                  type="text"
                  name="recommendedMaterials"
                  defaultValue={p?.print_settings?.recommendedMaterials?.join(
                    ", ",
                  )}
                  className={FIELD}
                />
              </label>
            </section>

            <label className={LABEL}>
              <span>
                Compatible printers{" "}
                <Info text="Comma separated, e.g. Bambu Lab A1, Prusa MK4" />
              </span>
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
              <span>
                Printing instructions{" "}
                <Info text="The printing explanation shown on the product page" />
              </span>
              <textarea
                name="instructions"
                defaultValue={p?.print_settings?.instructions}
                rows={4}
                className={FIELD}
                placeholder="e.g. Print flat side down, 0.2mm layers, no supports needed, PLA or PETG recommended."
              />
            </label>
          </div>
          <div className="flex flex-col gap-6 rounded-3xl p-6 glass">
            <AlsoShowIn
              groups={TRACK_GROUPS.map((group) => ({
                track: group.track,
                label: group.label,
                collections: COLLECTION_LIST.filter(
                  (c) => c.track === group.track,
                ).map((c) => ({
                  slug: c.slug,
                  name: c.name,
                  color: c.color,
                  track: c.track ?? group.track,
                })),
              }))}
              initialCategory={initialCategory}
              initialExtra={p?.extra_categories ?? []}
            />

            <section className="grid gap-4 sm:grid-cols-3">
              <label className={LABEL}>
                Version
                <input
                  type="text"
                  name="version"
                  defaultValue={p?.version ?? "1.0.0"}
                  className={FIELD}
                />
              </label>
              <label className="flex items-end gap-2 pb-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  name="isFree"
                  defaultChecked={p?.is_free}
                  className="h-4 w-4"
                />
                Free design
              </label>
            </section>

            <label className={LABEL}>
              <span>
                Tags{" "}
                <Info text="Search words, comma separated — used by the site search and shown on the product page for Google. Mix English and Dutch, e.g. ikea, kallax, storage, opbergen" />
              </span>
              <input
                type="text"
                name="tags"
                defaultValue={p?.tags?.join(", ")}
                className={FIELD}
                placeholder="e.g. ikea, kallax, trofast, storage, opbergen, bak"
              />
            </label>

            <label className={LABEL}>
              <span>
                Compatible with{" "}
                <Info text="One per line: Name | link (the link is optional). Shown on the product page and searchable." />
              </span>
              <textarea
                name="compatible"
                rows={2}
                defaultValue={formatCompatible(p?.external_links?.compatible)}
                className={FIELD}
                placeholder={"IKEA KALLAX | https://www.ikea.com/nl/nl/search/?q=kallax"}
              />
            </label>

            <label className={LABEL}>
              <span>
                Internal notes{" "}
                <Info text="Original filename in your design software — never shown to customers" />
              </span>
              <input
                type="text"
                name="sourceFilename"
                defaultValue={p?.source_filename ?? ""}
                className={FIELD}
                placeholder="e.g. storage-box-v2-final-ACTUALFINAL.f3d"
              />
            </label>

            <p className="text-ink/60 text-xs">
              Polar: saving lists this product automatically, one Polar product
              per license with the prices above (free and archived products are
              taken off).{" "}
              {Object.values(p?.commerce_product_ids ?? {}).some(Boolean)
                ? `Listed now: ${Object.keys(p?.commerce_product_ids ?? {}).join(", ")}.`
                : "Not listed yet."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg transition-colors w-fit rounded-full px-6 py-3 text-sm font-semibold"
        >
          {p ? "Save changes" : "Create product"}
        </button>
        {p?.publication_status !== "published" && (
          <button
            type="submit"
            name="setLive"
            value="1"
            className="rounded-full border border-white bg-white/35 px-6 py-3 text-sm font-semibold text-white shadow-md backdrop-blur-lg transition-colors hover:border-brand-purple hover:bg-brand-purple/60"
          >
            {p ? "Save & set live" : "Create & set live"}
          </button>
        )}
      </div>
    </form>
  );
}
