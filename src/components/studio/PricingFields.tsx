"use client";

import { useEffect, useRef, useState } from "react";
import type { CollectionSlug } from "@/lib/config/colors";
import {
  PRICE_TIERS,
  calculatePrices,
  centsToInput,
  formatEuro,
  parseEuroToCents,
  tierCents,
  type Complexity,
  type PriceTier,
  type PricingSettings,
} from "@/lib/pricing/calculate";

const FIELD =
  "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

const TIER_LABEL: Record<PriceTier, string> = {
  personal: "Personal",
  small: "Small (commercial)",
  unlimited: "Unlimited (commercial)",
};

export interface ExistingPricing {
  complexity: Complexity;
  isSet: boolean;
  partCount: number;
  includesStep: boolean;
  /** Stored chosen price per tier (null before the pricing tool existed) */
  chosen: Partial<Record<PriceTier, number | null>>;
  /** Tiers whose chosen price was typed in by hand */
  overridden: PriceTier[];
}

/**
 * Per tier: "calc" follows the live calculation, "manual" is a typed
 * price, "keep" holds an existing product's stored price that predates a
 * change to the price table — kept until an input changes or you click
 * "Update" (see productPricingFromForm on the server).
 */
type Mode = "calc" | "manual" | "keep";

/**
 * The pricing block of the product form. Recalculates live from the
 * Pricing settings as the inputs change; each price can be typed over
 * (marked "overridden") and reset back to the calculated value. The server
 * recalculates on save (productPricingFromForm); these fields carry the
 * inputs plus, per tier, a mode and the typed price.
 *
 * The collection select lives in the surrounding (server) form, so this
 * listens for changes on that form rather than owning the field.
 */
export function PricingFields({
  settings,
  initialCategory,
  existing,
}: {
  settings: PricingSettings;
  initialCategory: CollectionSlug;
  existing?: ExistingPricing;
}) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const [category, setCategory] = useState(initialCategory);
  const [complexity, setComplexity] = useState<Complexity>(
    existing?.complexity ?? "standard",
  );
  const [isSet, setIsSet] = useState(existing?.isSet ?? false);
  const [partCount, setPartCount] = useState(existing?.partCount ?? 2);
  const [includesStep, setIncludesStep] = useState(
    existing?.includesStep ?? false,
  );
  const [modes, setModes] = useState<Record<PriceTier, Mode>>(() => {
    const initial = calculatePrices(settings, {
      category: initialCategory,
      complexity: existing?.complexity ?? "standard",
      isSet: existing?.isSet ?? false,
      partCount: existing?.partCount ?? 1,
      includesStep: existing?.includesStep ?? false,
    });
    return Object.fromEntries(
      PRICE_TIERS.map((tier) => {
        const stored = existing?.chosen[tier];
        if (stored == null) return [tier, "calc"];
        if (existing?.overridden.includes(tier)) return [tier, "manual"];
        return [tier, stored === tierCents(initial, tier) ? "calc" : "keep"];
      }),
    ) as Record<PriceTier, Mode>;
  });
  const [typed, setTyped] = useState<Partial<Record<PriceTier, string>>>(() =>
    Object.fromEntries(
      PRICE_TIERS.flatMap((tier) => {
        const stored = existing?.chosen[tier];
        return stored == null ? [] : [[tier, centsToInput(stored)]];
      }),
    ),
  );

  // Changing what the price is based on means the old stored price no
  // longer applies — those tiers follow the calculation again.
  const dropKept = () =>
    setModes(
      (m) =>
        Object.fromEntries(
          PRICE_TIERS.map((tier) => [
            tier,
            m[tier] === "keep" ? "calc" : m[tier],
          ]),
        ) as Record<PriceTier, Mode>,
    );

  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target.name === "category") {
        setCategory(target.value as CollectionSlug);
        dropKept();
      }
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);

  const result = calculatePrices(settings, {
    category,
    complexity,
    isSet,
    partCount,
    includesStep,
  });

  const setMode = (tier: PriceTier, mode: Mode) =>
    setModes((m) => ({ ...m, [tier]: mode }));

  return (
    <fieldset ref={ref} className="flex flex-col gap-4">
      <legend className="font-display mb-2 text-lg font-semibold">
        Prices
      </legend>

      <section className="grid gap-4 sm:grid-cols-3">
        <label className={LABEL}>
          Complexity
          <select
            name="complexity"
            value={complexity}
            onChange={(e) => {
              setComplexity(e.target.value as Complexity);
              dropKept();
            }}
            className={FIELD}
          >
            <option value="simple">Simple</option>
            <option value="standard">Standard</option>
            <option value="complex">Complex</option>
          </select>
        </label>
        <label className={LABEL}>
          Type
          <select
            value={isSet ? "set" : "single"}
            onChange={(e) => {
              setIsSet(e.target.value === "set");
              dropKept();
            }}
            className={FIELD}
          >
            <option value="single">Single model</option>
            <option value="set">Set</option>
          </select>
          {isSet && <input type="hidden" name="isSet" value="on" />}
        </label>
        {isSet ? (
          <label className={LABEL}>
            Number of parts
            <input
              type="number"
              name="partCount"
              min={1}
              value={partCount}
              onChange={(e) => {
                setPartCount(Math.max(1, Number(e.target.value) || 1));
                dropKept();
              }}
              className={FIELD}
            />
          </label>
        ) : (
          <div />
        )}
      </section>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="includesStep"
          checked={includesStep}
          onChange={(e) => {
            setIncludesStep(e.target.checked);
            dropKept();
          }}
          className="h-4 w-4"
        />
        STEP file included (+ {formatEuro(settings.stepSurchargeCents)})
      </label>

      <div className="divide-line divide-y rounded-2xl glass">
        {PRICE_TIERS.map((tier) => {
          const calc = tierCents(result, tier);
          const mode = modes[tier];
          const value =
            mode === "calc" ? centsToInput(calc) : (typed[tier] ?? "");
          const invalid = mode === "manual" && parseEuroToCents(value) === null;
          const overridden =
            mode === "manual" && !invalid && parseEuroToCents(value) !== calc;
          return (
            <div
              key={tier}
              className="flex flex-wrap items-center gap-3 p-4 text-sm"
            >
              <input type="hidden" name={`price_${tier}_mode`} value={mode} />
              <div className="min-w-40 flex-1">
                <p className="font-medium">{TIER_LABEL[tier]}</p>
                <p className="text-ink/60 text-xs">
                  Calculated: {formatEuro(calc)}
                  {overridden && (
                    <span className="border-brand-purple bg-brand-purple/15 ml-2 rounded-full border px-2 py-0.5 font-semibold">
                      overridden
                    </span>
                  )}
                </p>
                {mode === "keep" && (
                  <p className="text-ink/60 text-xs">
                    Keeps its current price (from before a price table change).
                  </p>
                )}
                {tier === "unlimited" && result.customFromCents !== null && (
                  <p className="text-ink/60 text-xs">
                    Businesses: custom work from{" "}
                    {formatEuro(result.customFromCents)} via contact
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ink/60">€</span>
                <input
                  type="text"
                  inputMode="decimal"
                  name={`price_${tier}`}
                  value={value}
                  onChange={(e) => {
                    setTyped((t) => ({ ...t, [tier]: e.target.value }));
                    setMode(tier, "manual");
                  }}
                  aria-invalid={invalid}
                  aria-label={`${TIER_LABEL[tier]} price`}
                  className={`${FIELD} w-28 ${invalid ? "border-red-400" : ""}`}
                />
                {(overridden || mode === "keep") && (
                  <button
                    type="button"
                    onClick={() => setMode(tier, "calc")}
                    className="border-line bg-mist hover:border-brand-purple hover:bg-brand-purple/45 rounded-full border px-3 py-1.5 text-xs transition-colors"
                  >
                    {mode === "keep" ? "Update" : "↺ Calculated"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-ink/60 text-xs">
        {result.inSubscription
          ? "Included in the All-Access subscription."
          : "Not included in the All-Access subscription."}{" "}
        Saving updates the prices on Polar automatically.
      </p>
    </fieldset>
  );
}
