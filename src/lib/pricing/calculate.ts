import type { CollectionSlug } from "@/lib/config/colors";

/**
 * Price calculation for Studio's pricing tool — the single place the
 * formula lives. Pure (no I/O), so the product form can run it live in
 * the browser and the server can re-run it on save and recalculate.
 *
 * All money is in integer cents; factors are plain numbers. Every value
 * comes from PricingSettings (editable under Studio → Pricing),
 * nothing is hardcoded in the formula itself.
 */

export type Complexity = "simple" | "standard" | "complex";
export type PriceTier = "personal" | "small" | "unlimited";

export const COMPLEXITIES: Complexity[] = ["simple", "standard", "complex"];
export const PRICE_TIERS: PriceTier[] = ["personal", "small", "unlimited"];

export interface CategoryPricing {
  baseCents: number;
  minCents: number;
  maxCents: number;
  inSubscription: boolean;
}

export interface PricingSettings {
  categories: Record<CollectionSlug, CategoryPricing>;
  complexityFactors: Record<Complexity, number>;
  /** Set factor = 1 + setFactorPerExtraPart × (parts − 1), capped at setFactorMax */
  setFactorPerExtraPart: number;
  setFactorMax: number;
  stepSurchargeCents: number;
  smallFactor: number;
  smallMinimumCents: number;
  unlimitedFactor: number;
  subscriptionMonthlyCents: number;
  subscriptionYearlyCents: number;
  customFromCents: number;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  categories: {
    "doll-mini": { baseCents: 450, minCents: 300, maxCents: 900, inSubscription: true },
    "home-living": { baseCents: 550, minCents: 300, maxCents: 900, inSubscription: true },
    "ikea-hacks": { baseCents: 350, minCents: 250, maxCents: 600, inSubscription: true },
    organize: { baseCents: 300, minCents: 250, maxCents: 500, inSubscription: true },
    "tech-electronics": { baseCents: 600, minCents: 400, maxCents: 1200, inSubscription: true },
    "serious-games": { baseCents: 800, minCents: 600, maxCents: 1500, inSubscription: false },
    other: { baseCents: 400, minCents: 250, maxCents: 900, inSubscription: true },
  },
  complexityFactors: { simple: 0.7, standard: 1.0, complex: 1.5 },
  setFactorPerExtraPart: 0.4,
  setFactorMax: 4.0,
  stepSurchargeCents: 300,
  smallFactor: 5,
  smallMinimumCents: 1500,
  unlimitedFactor: 3,
  subscriptionMonthlyCents: 995,
  subscriptionYearlyCents: 9900,
  customFromCents: 25000,
};

/**
 * Stored settings merged over the defaults, so a category or setting added
 * to the code later still has a value before it's ever been saved.
 */
export function withDefaults(stored: Partial<PricingSettings> | null | undefined): PricingSettings {
  const d = DEFAULT_PRICING_SETTINGS;
  if (!stored) return d;
  const categories = { ...d.categories };
  for (const slug of Object.keys(categories) as CollectionSlug[]) {
    categories[slug] = { ...d.categories[slug], ...stored.categories?.[slug] };
  }
  return {
    ...d,
    ...stored,
    categories,
    complexityFactors: { ...d.complexityFactors, ...stored.complexityFactors },
  };
}

export interface PriceInput {
  category: CollectionSlug;
  complexity: Complexity;
  isSet: boolean;
  partCount: number;
  includesStep: boolean;
}

export interface PriceResult {
  personalCents: number;
  smallCents: number;
  unlimitedCents: number;
  inSubscription: boolean;
  /** Only for Serious Games: businesses get custom work from this amount */
  customFromCents: number | null;
}

const roundTo = (cents: number, step: number) => Math.round(cents / step) * step;
const floorTo = (cents: number, step: number) => Math.floor(cents / step) * step;

export function setFactor(settings: PricingSettings, partCount: number): number {
  const parts = Math.max(1, Math.floor(partCount));
  return Math.min(1 + settings.setFactorPerExtraPart * (parts - 1), settings.setFactorMax);
}

export function calculatePrices(settings: PricingSettings, input: PriceInput): PriceResult {
  const cat = settings.categories[input.category] ?? settings.categories.other;

  let raw = cat.baseCents * settings.complexityFactors[input.complexity];
  if (input.includesStep) raw += settings.stepSurchargeCents;
  if (input.isSet) raw *= setFactor(settings, input.partCount);

  // Round first, then clamp — so the result never lands outside min/max.
  const personalCents = Math.min(Math.max(roundTo(raw, 50), cat.minCents), cat.maxCents);
  const smallCents = roundTo(
    Math.max(personalCents * settings.smallFactor, settings.smallMinimumCents),
    50,
  );
  // The tiny epsilon keeps float noise (e.g. 4499.9999) from flooring a step down.
  const unlimitedCents = floorTo(smallCents * settings.unlimitedFactor + 1e-6, 500);

  return {
    personalCents,
    smallCents,
    unlimitedCents,
    inSubscription: cat.inSubscription,
    customFromCents: input.category === "serious-games" ? settings.customFromCents : null,
  };
}

export function tierCents(result: PriceResult, tier: PriceTier): number {
  return tier === "personal"
    ? result.personalCents
    : tier === "small"
      ? result.smallCents
      : result.unlimitedCents;
}

/* ---------- Dutch formatting & parsing ---------- */

const EUR = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

/** 450 → "€ 4,50" */
export function formatEuro(cents: number): string {
  return EUR.format(cents / 100);
}

/**
 * Accepts both "4,50" and "4.50" (and "€ 4,50"). Returns null for anything
 * that isn't a plain non-negative number.
 */
export function parseDecimal(value: string): number | null {
  const cleaned = value.replace(/[€\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

/** "4,50" → 450, or null if not a valid amount */
export function parseEuroToCents(value: string): number | null {
  const n = parseDecimal(value);
  return n === null ? null : Math.round(n * 100);
}

/** 450 → "4,50" — the editable form of an amount */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/* ---------- Validation ---------- */

/** Human-readable problems with a settings object; empty when valid. */
export function validateSettings(s: PricingSettings, names: Record<string, string> = {}): string[] {
  const errors: string[] = [];
  const amount = (label: string, cents: number) => {
    if (!Number.isFinite(cents) || cents < 0) errors.push(`${label}: not a valid amount`);
  };
  const factor = (label: string, value: number) => {
    if (!Number.isFinite(value) || value <= 0) errors.push(`${label}: must be greater than 0`);
  };

  for (const [slug, c] of Object.entries(s.categories)) {
    const name = names[slug] ?? slug;
    amount(`${name} base price`, c.baseCents);
    amount(`${name} min`, c.minCents);
    amount(`${name} max`, c.maxCents);
    if (c.minCents > c.baseCents || c.baseCents > c.maxCents) {
      errors.push(`${name}: min ≤ base price ≤ max is not true`);
    }
  }
  factor("Simple factor", s.complexityFactors.simple);
  factor("Standard factor", s.complexityFactors.standard);
  factor("Complex factor", s.complexityFactors.complex);
  if (!Number.isFinite(s.setFactorPerExtraPart) || s.setFactorPerExtraPart < 0) {
    errors.push("Set factor per extra part: can't be negative");
  }
  if (!Number.isFinite(s.setFactorMax) || s.setFactorMax < 1) {
    errors.push("Maximum set factor: must be at least 1");
  }
  amount("STEP surcharge", s.stepSurchargeCents);
  factor("Small factor", s.smallFactor);
  amount("Small minimum", s.smallMinimumCents);
  factor("Unlimited factor", s.unlimitedFactor);
  amount("Subscription per month", s.subscriptionMonthlyCents);
  amount("Subscription per year", s.subscriptionYearlyCents);
  amount("Custom work from", s.customFromCents);
  return errors;
}
