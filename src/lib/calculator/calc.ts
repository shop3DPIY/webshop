/**
 * 3D print cost & selling-price calculator — shared by the public page
 * (/tools/3d-print-cost-calculator, a few inputs) and the full version
 * in the account (everything below, saved per user).
 *
 * All money in euros (floats); rounded only for display. Pure functions,
 * no I/O — see calc.test.ts.
 */

export interface MaterialLine {
  name: string;
  /** Grams for the whole plate (all items on it) */
  grams: number;
  pricePerKg: number;
}

export interface ExtraLine {
  name: string;
  /** Cost per item (magnets, screws, paint, inserts…) */
  cost: number;
}

export type VatMode = "vat21" | "vat9" | "kor";
export type RoundMode = "none" | "99" | "50";

export interface PlatformPreset {
  id: string;
  /** Percentage of what the customer pays (price + shipping) */
  feePct: number;
  /** Fixed fee per order */
  feeFixed: number;
  /** Listing fee per item sold (e.g. Etsy renews the listing per sale) */
  listingFee: number;
}

/**
 * Rough fees, November 2026 — platforms change these, so every number is
 * editable. Etsy: 6.5 % transaction + ~4 % + €0.30 payment processing in
 * the Netherlands + ~€0.19 listing fee per sale; Offsite Ads adds up to 15 %.
 */
export const PLATFORM_PRESETS: PlatformPreset[] = [
  { id: "none", feePct: 0, feeFixed: 0, listingFee: 0 },
  { id: "etsy", feePct: 10.5, feeFixed: 0.3, listingFee: 0.19 },
  { id: "etsyAds", feePct: 25.5, feeFixed: 0.3, listingFee: 0.19 },
  { id: "webshop", feePct: 1.9, feeFixed: 0.3, listingFee: 0 },
  { id: "custom", feePct: 0, feeFixed: 0, listingFee: 0 },
];

export interface CalcInputs {
  /** How many items one print (plate) makes */
  itemsPerPlate: number;
  materials: MaterialLine[];
  /** Per plate: AMS purge ("poop"), purge tower, brim, failed first layers */
  wasteGrams: number;
  printHours: number;

  printerPrice: number;
  printerLifeHours: number;
  /** Nozzles, build plates, belts, lubricant… per print hour */
  maintenancePerHour: number;
  powerWatts: number;
  kwhPrice: number;
  /** Share of prints that fail and must be redone */
  failurePct: number;

  hourlyRate: number;
  /** Per plate: slicing, plate prep, starting and checking the print */
  prepMinutes: number;
  /** Per item: removing supports, sanding, painting, assembly */
  postMinutes: number;
  /** Per item: packing, label, taking it to the post */
  packMinutes: number;

  /** Your own design time for this product (paid back over designUnits) */
  designHours: number;
  /** A bought commercial license or paid file (paid back over designUnits) */
  designLicenseCost: number;
  /** How many you expect to sell — the design costs are spread over these */
  designUnits: number;
  /** Test prints and prototypes before it was right (paid back over designUnits) */
  prototypeCost: number;

  extras: ExtraLine[];
  packagingCost: number;
  /** What the postage costs you per order */
  shippingCost: number;
  /** What the customer pays you for shipping */
  shippingCharged: number;

  /** Monthly fixed costs: software, website, insurance, workspace, subscriptions */
  overheadPerMonth: number;
  /** Items you sell per month — the overhead is spread over these */
  itemsPerMonth: number;

  platformId: string;
  feePct: number;
  feeFixed: number;
  listingFee: number;

  vatMode: VatMode;
  /** Reserve for returns, refunds, discounts and lost parcels (% of revenue) */
  returnsPct: number;

  profitMode: "margin" | "amount";
  /** Margin in % of your revenue excl. VAT, or a fixed amount per item */
  profitValue: number;
  roundMode: RoundMode;
}

export const DEFAULT_INPUTS: CalcInputs = {
  itemsPerPlate: 1,
  materials: [{ name: "PLA", grams: 50, pricePerKg: 20 }],
  wasteGrams: 0,
  printHours: 3,
  printerPrice: 700,
  printerLifeHours: 5000,
  maintenancePerHour: 0.05,
  powerWatts: 120,
  kwhPrice: 0.3,
  failurePct: 5,
  hourlyRate: 20,
  prepMinutes: 5,
  postMinutes: 5,
  packMinutes: 3,
  designHours: 0,
  designLicenseCost: 0,
  designUnits: 50,
  prototypeCost: 0,
  extras: [],
  packagingCost: 0.5,
  shippingCost: 0,
  shippingCharged: 0,
  overheadPerMonth: 0,
  itemsPerMonth: 20,
  platformId: "etsy",
  feePct: 10.5,
  feeFixed: 0.3,
  listingFee: 0.19,
  vatMode: "kor",
  returnsPct: 2,
  profitMode: "margin",
  profitValue: 30,
  roundMode: "99",
};

export const VAT_RATES: Record<VatMode, number> = { vat21: 0.21, vat9: 0.09, kor: 0 };

/** Missing or broken fields fall back to the defaults (saved/old inputs). */
export function withDefaults(input: Partial<CalcInputs> | null | undefined): CalcInputs {
  const out = { ...DEFAULT_INPUTS } as Record<string, unknown>;
  for (const [key, def] of Object.entries(DEFAULT_INPUTS)) {
    const value = (input as Record<string, unknown> | undefined)?.[key];
    if (typeof def === "number") {
      if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    } else if (typeof def === "string") {
      if (typeof value === "string") out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value;
    }
  }
  const result = out as unknown as CalcInputs;
  result.materials = (result.materials ?? [])
    .filter((m) => m && typeof m === "object")
    .map((m) => ({ name: String(m.name ?? ""), grams: num(m.grams), pricePerKg: num(m.pricePerKg) }));
  result.extras = (result.extras ?? [])
    .filter((e) => e && typeof e === "object")
    .map((e) => ({ name: String(e.name ?? ""), cost: num(e.cost) }));
  if (!(result.vatMode in VAT_RATES)) result.vatMode = "kor";
  return result;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const pos = (v: number) => Math.max(0, v);

export interface CostLine {
  key: string;
  amount: number;
}

export interface CalcResult {
  /** Cost lines per item, before platform fees */
  lines: CostLine[];
  /** Cost price per item (everything except platform fees, VAT and profit) */
  costPrice: number;
  /** Price the customer pays per item (incl. VAT where it applies) */
  price: number;
  /** The exact price before rounding */
  rawPrice: number;
  vat: number;
  platformFees: number;
  returnsReserve: number;
  profit: number;
  /** Profit as % of revenue excl. VAT */
  marginPct: number;
  /** What one hour of your own work earns: (labour + profit) per labour hour */
  earningsPerHour: number | null;
  /** Items to sell before the design costs are paid back */
  designBreakEven: number | null;
  /** The settings can't give a profit (fees + margin ≥ 100 %) */
  impossible: boolean;
}

function roundPrice(price: number, mode: RoundMode): number {
  if (mode === "none" || price <= 0) return price;
  if (mode === "50") return Math.ceil(price * 2 - 1e-9) / 2;
  // Up to the next x.99 (x.99 itself stays).
  return Math.ceil(price + 0.01 - 1e-9) - 0.01;
}

export function calculate(raw: Partial<CalcInputs>): CalcResult {
  const i = withDefaults(raw);
  const items = Math.max(1, Math.floor(i.itemsPerPlate) || 1);
  const perPlate = (v: number) => v / items;

  const gramsTotal = i.materials.reduce((s, m) => s + pos(m.grams), 0);
  const materialCost = i.materials.reduce((s, m) => s + (pos(m.grams) * pos(m.pricePerKg)) / 1000, 0);
  // Waste is costed at the average price of the materials used.
  const avgPerGram = gramsTotal > 0 ? materialCost / gramsTotal : (i.materials[0]?.pricePerKg ?? 20) / 1000;
  const material = perPlate(materialCost);
  const waste = perPlate(pos(i.wasteGrams) * avgPerGram);
  const energy = perPlate((pos(i.powerWatts) / 1000) * pos(i.printHours) * pos(i.kwhPrice));
  const machine = perPlate(
    (i.printerLifeHours > 0 ? pos(i.printerPrice) / i.printerLifeHours : 0) * pos(i.printHours) +
      pos(i.maintenancePerHour) * pos(i.printHours),
  );
  const failRate = Math.min(pos(i.failurePct), 90) / 100;
  // A failed print costs material, power and machine time again.
  const failures = (material + waste + energy + machine) * (failRate / (1 - failRate));

  const labourMinutes = perPlate(pos(i.prepMinutes)) + pos(i.postMinutes) + pos(i.packMinutes);
  const labour = (labourMinutes / 60) * pos(i.hourlyRate);

  const designTotal = pos(i.designHours) * pos(i.hourlyRate) + pos(i.designLicenseCost) + pos(i.prototypeCost);
  const design = designTotal / Math.max(1, i.designUnits);

  const extras = i.extras.reduce((s, e) => s + pos(e.cost), 0);
  const packaging = pos(i.packagingCost);
  // Postage you pay minus what the customer pays for it (can be negative).
  const shipping = pos(i.shippingCost) - pos(i.shippingCharged);
  const overhead = pos(i.overheadPerMonth) / Math.max(1, i.itemsPerMonth);

  const lines: CostLine[] = [
    { key: "material", amount: material },
    { key: "waste", amount: waste },
    { key: "energy", amount: energy },
    { key: "machine", amount: machine },
    { key: "failures", amount: failures },
    { key: "labour", amount: labour },
    { key: "design", amount: design },
    { key: "extras", amount: extras },
    { key: "packaging", amount: packaging },
    { key: "shipping", amount: shipping },
    { key: "overhead", amount: overhead },
  ];
  const costPrice = lines.reduce((s, l) => s + l.amount, 0);

  const v = VAT_RATES[i.vatMode];
  const p = pos(i.feePct) / 100;
  const r = pos(i.returnsPct) / 100;
  const fixedFees = pos(i.feeFixed) + pos(i.listingFee) + p * pos(i.shippingCharged);
  const m = i.profitMode === "margin" ? pos(i.profitValue) / 100 : 0;
  const target = i.profitMode === "amount" ? pos(i.profitValue) : 0;

  // Revenue excl. VAT = P/(1+v). Profit = P/(1+v)·(1 − r) − p·P − fixed − cost,
  // and should equal m·P/(1+v) + target. Solve for P:
  const denominator = (1 - r - m) / (1 + v) - p;
  const impossible = denominator <= 0;
  const rawPrice = impossible ? 0 : (costPrice + fixedFees + target) / denominator;
  const price = roundPrice(rawPrice, i.roundMode);

  const net = price / (1 + v);
  const vat = price - net;
  const platformFees = p * price + fixedFees;
  const returnsReserve = r * net;
  const profit = impossible ? 0 : net - returnsReserve - platformFees - costPrice;
  const labourHours = labourMinutes / 60;

  return {
    lines,
    costPrice,
    price,
    rawPrice,
    vat,
    platformFees,
    returnsReserve,
    profit,
    marginPct: net > 0 ? (profit / net) * 100 : 0,
    earningsPerHour: labourHours > 0 && !impossible ? (labour + profit) / labourHours : null,
    designBreakEven:
      designTotal > 0 && !impossible
        ? Math.ceil(designTotal / Math.max(0.01, profit + design))
        : null,
    impossible,
  };
}
