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
import { BundleFields, type BundleCandidate } from "./BundleFields";
import { InvolvesFields } from "./InvolvesFields";
import { TEST_PRINTERS } from "@/lib/productDetails";

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
    colorSetup?: "ams" | "no-ams";
    printTech?: "fdm" | "resin";
    nozzleMm?: number;
    printTimeHours?: number;
    filamentGrams?: number;
    infillPct?: number;
    requiredParts?: { qty: number; name: string; url?: string }[];
    scale?: string;
    plates?: number;
    parts?: number;
    difficulty?: number;
    involves?: ("print" | "sew" | "parts" | "electronics" | "paint")[];
    instructions?: string;
    compatiblePrinters?: string[];
  } | null;
  download_files: { format: string; fileName: string }[];
  images: { src: string; alt: string }[] | null;
  timelapse_url: string | null;
  source_filename: string | null;
  external_links: { compatible?: { label: string; url?: string }[]; makerWorld?: string } | null;
  complexity: Complexity;
  is_set: boolean;
  part_count: number;
  includes_step: boolean;
  price_cents: number | null;
  price_small_cents: number | null;
  price_unlimited_cents: number | null;
  price_overrides: PriceTier[] | null;
  bundle_product_ids: string[] | null;
  product_kind: "print" | "pattern" | null;
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
  bundleCandidates,
}: {
  product?: ExistingProduct;
  pricingSettings: PricingSettings;
  /** ANTHROPIC_API_KEY is set, so "Text with AI" works */
  aiAvailable: boolean;
  /** Designs that can go in a bundle (see src/lib/studio/bundles.ts) */
  bundleCandidates: BundleCandidate[];
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

            <section className="grid gap-4 sm:grid-cols-2">
              <label className={LABEL}>
                <span>
                  Type <Info text="A sewing pattern hides the printing details on the product page; upload it as 'Sewing pattern PDF'" />
                </span>
                <select name="productKind" defaultValue={p?.product_kind ?? "print"} className={FIELD}>
                  <option value="print">3D print design</option>
                  <option value="pattern">Sewing pattern (dolls)</option>
                </select>
              </label>
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
            <BundleFields
              candidates={bundleCandidates}
              initialIds={p?.bundle_product_ids ?? []}
              initialCategory={initialCategory}
              // Only hand-typed prices go in the fields; the rest follow
              // the suggestion.
              initialPrices={Object.fromEntries(
                (p?.price_overrides ?? []).map((tier) => [
                  tier,
                  tier === "personal"
                    ? p?.price_cents
                    : tier === "small"
                      ? p?.price_small_cents
                      : p?.price_unlimited_cents,
                ]),
              )}
            />
          </div>
          {/* Hidden by BundleFields while the product is a bundle. */}
          <div data-pricing-tile className="flex flex-col gap-6 rounded-3xl p-6 glass">
            <PricingFields
              settings={pricingSettings}
              initialCategory={initialCategory}
              initialFree={p?.is_free}
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

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">
                Tested on{" "}
                <Info text="The printers you printed it on yourself. A1 mini fit is shown automatically from the size." />
              </legend>
              <div className="flex flex-wrap gap-4">
                {TEST_PRINTERS.map((printer) => (
                  <label key={printer} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="testedPrinter"
                      value={printer}
                      defaultChecked={p?.print_settings?.compatiblePrinters?.includes(printer)}
                      className="h-4 w-4"
                    />
                    {printer}
                  </label>
                ))}
              </div>
              <input
                type="text"
                name="compatiblePrinters"
                defaultValue={p?.print_settings?.compatiblePrinters
                  ?.filter((x) => !TEST_PRINTERS.includes(x))
                  .join(", ")}
                placeholder="Other printers, comma separated"
                className={FIELD}
              />
            </fieldset>

            <section className="grid gap-4 sm:grid-cols-3">
              <label className={LABEL}>
                <span>
                  Scale <Info text="For dolls and miniatures, e.g. 1:6 or 1:12" />
                </span>
                <input name="scale" list="scales" defaultValue={p?.print_settings?.scale ?? ""} placeholder="e.g. 1:6" className={FIELD} />
                <datalist id="scales">
                  {["1:3", "1:4", "1:6", "1:12", "1:24"].map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </label>
              <label className={LABEL}>
                Plates
                <input type="text" inputMode="numeric" name="plates" defaultValue={p?.print_settings?.plates} className={FIELD} />
              </label>
              <label className={LABEL}>
                Parts
                <input type="text" inputMode="numeric" name="parts" defaultValue={p?.print_settings?.parts} className={FIELD} />
              </label>
            </section>

            <label className={LABEL}>
              <span>
                Difficulty <Info text="Auto works it out from parts, supports, extra parts and electronics. Pick a level to override it." />
              </span>
              <select name="difficulty" defaultValue={p?.print_settings?.difficulty ?? ""} className={FIELD}>
                <option value="">Auto</option>
                <option value="1">1 — Very easy</option>
                <option value="2">2 — Easy</option>
                <option value="3">3 — Medium</option>
                <option value="4">4 — Advanced</option>
                <option value="5">5 — Expert</option>
              </select>
            </label>

            <InvolvesFields initial={p?.print_settings?.involves ?? null} />

            <section className="grid gap-4 sm:grid-cols-3">
              <label className={LABEL}>
                Printer type
                <select name="printTech" defaultValue={p?.print_settings?.printTech ?? "fdm"} className={FIELD}>
                  <option value="fdm">FDM (filament)</option>
                  <option value="resin">Resin (SLA/MSLA)</option>
                </select>
              </label>
              <label className={LABEL}>
                Nozzle (mm)
                <input type="text" inputMode="decimal" name="nozzleMm" defaultValue={p?.print_settings?.nozzleMm ?? 0.4} className={FIELD} />
              </label>
              <label className={LABEL}>
                Infill (%)
                <input type="text" inputMode="decimal" name="infillPct" defaultValue={p?.print_settings?.infillPct} placeholder="e.g. 15" className={FIELD} />
              </label>
              <label className={LABEL}>
                <span>
                  Print time (hours){" "}
                  <Info text="All parts together, as the slicer says. Shown on the page and used by the cost calculator link." />
                </span>
                <input type="text" inputMode="decimal" name="printTimeHours" defaultValue={p?.print_settings?.printTimeHours} placeholder="e.g. 3,5" className={FIELD} />
              </label>
              <label className={LABEL}>
                Filament (grams)
                <input type="text" inputMode="decimal" name="filamentGrams" defaultValue={p?.print_settings?.filamentGrams} placeholder="e.g. 85" className={FIELD} />
              </label>
            </section>

            <label className={LABEL}>
              <span>
                Extra parts needed{" "}
                <Info text="One per line: 4x magnet 6×2 mm | link (link optional). For electronics, screws, magnets, inserts…" />
              </span>
              <textarea
                name="requiredParts"
                rows={3}
                defaultValue={(p?.print_settings?.requiredParts ?? [])
                  .map((part) => `${part.qty}x ${part.name}${part.url ? ` | ${part.url}` : ""}`)
                  .join("\n")}
                className={FIELD}
                placeholder={"4x magnet 6×2 mm\n1x ESP32 D1 mini | https://…"}
              />
            </label>

            <label className={LABEL}>
              <span>
                Colours / AMS{" "}
                <Info text="Shown on the product page and the product card" />
              </span>
              <select
                name="colorSetup"
                defaultValue={p?.print_settings?.colorSetup ?? ""}
                className={FIELD}
              >
                <option value="">Not stated</option>
                <option value="ams">Multicolour with AMS — can also be printed in one colour</option>
                <option value="no-ams">No AMS needed — one colour or separate parts</option>
              </select>
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
                placeholder={
                  "IKEA KALLAX | https://www.ikea.com/nl/nl/search/?q=kallax"
                }
              />
            </label>

            <label className={LABEL}>
              <span>
                MakerWorld model{" "}
                <Info text="Model number or link. On free designs the page offers 'Download in Bambu Studio' via MakerWorld, which earns you points." />
              </span>
              <input
                type="text"
                name="makerWorld"
                defaultValue={p?.external_links?.makerWorld ?? ""}
                className={FIELD}
                placeholder="e.g. 123456 or https://makerworld.com/en/models/123456"
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
              {p?.is_free || p?.publication_status === "archived"
                ? "Not on sale on Polar now."
                : Object.values(p?.commerce_product_ids ?? {}).some(Boolean)
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
