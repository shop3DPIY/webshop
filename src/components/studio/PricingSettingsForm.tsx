"use client";

import { useState, useTransition } from "react";
import type { CollectionSlug } from "@/lib/config/colors";
import {
  DEFAULT_PRICING_SETTINGS,
  calculatePrices,
  centsToInput,
  formatEuro,
  parseDecimal,
  parseEuroToCents,
  validateSettings,
  type PricingSettings,
} from "@/lib/pricing/calculate";
import { savePricingSettings } from "@/lib/studio/actions";

const INPUT = "border-line bg-paper w-24 rounded-xl border px-3 py-2 text-sm";
const BUTTON_SECONDARY =
  "border-line bg-mist hover:border-brand-purple hover:bg-brand-purple/45 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors";

type CategoryRow = {
  base: string;
  min: string;
  max: string;
  inSubscription: boolean;
  /** Blank = use the general factor */
  smallFactor: string;
  unlimitedFactor: string;
};

/** The general settings, in display order: key, label, and money vs factor. */
const GENERAL: { key: GeneralKey; label: string; money: boolean }[] = [
  { key: "simple", label: "Simple factor", money: false },
  { key: "standard", label: "Standard factor", money: false },
  { key: "complex", label: "Complex factor", money: false },
  {
    key: "setFactorPerExtraPart",
    label: "Set factor per extra part",
    money: false,
  },
  { key: "setFactorMax", label: "Maximum set factor", money: false },
  { key: "stepSurchargeCents", label: "STEP surcharge", money: true },
  { key: "smallFactor", label: "Small factor", money: false },
  { key: "smallMinimumCents", label: "Small minimum", money: true },
  { key: "unlimitedFactor", label: "Unlimited factor", money: false },
  {
    key: "subscriptionMonthlyCents",
    label: "Subscription per month",
    money: true,
  },
  {
    key: "subscriptionYearlyCents",
    label: "Subscription per year",
    money: true,
  },
  { key: "customFromCents", label: "Custom work from", money: true },
];

type GeneralKey =
  | "simple"
  | "standard"
  | "complex"
  | "setFactorPerExtraPart"
  | "setFactorMax"
  | "stepSurchargeCents"
  | "smallFactor"
  | "smallMinimumCents"
  | "unlimitedFactor"
  | "subscriptionMonthlyCents"
  | "subscriptionYearlyCents"
  | "customFromCents";

function generalValue(s: PricingSettings, key: GeneralKey): number {
  return key === "simple" || key === "standard" || key === "complex"
    ? s.complexityFactors[key]
    : s[key];
}

const factorToInput = (n: number) => String(n).replace(".", ",");

function toForm(s: PricingSettings) {
  const categories = Object.fromEntries(
    Object.entries(s.categories).map(([slug, c]) => [
      slug,
      {
        base: centsToInput(c.baseCents),
        min: centsToInput(c.minCents),
        max: centsToInput(c.maxCents),
        inSubscription: c.inSubscription,
        smallFactor: c.smallFactor != null ? factorToInput(c.smallFactor) : "",
        unlimitedFactor:
          c.unlimitedFactor != null ? factorToInput(c.unlimitedFactor) : "",
      },
    ]),
  ) as Record<CollectionSlug, CategoryRow>;
  const general = Object.fromEntries(
    GENERAL.map(({ key, money }) => {
      const v = generalValue(s, key);
      return [key, money ? centsToInput(v) : factorToInput(v)];
    }),
  ) as Record<GeneralKey, string>;
  return { categories, general };
}

/** Form strings → settings, plus every field that isn't a valid number. */
function fromForm(
  categories: Record<CollectionSlug, CategoryRow>,
  general: Record<GeneralKey, string>,
  names: Record<string, string>,
): { settings: PricingSettings; errors: string[] } {
  const errors: string[] = [];
  const money = (label: string, v: string) => {
    const n = parseEuroToCents(v);
    if (n === null) errors.push(`${label}: not a valid amount`);
    return n ?? 0;
  };
  const num = (label: string, v: string) => {
    const n = parseDecimal(v);
    if (n === null) errors.push(`${label}: not a valid number`);
    return n ?? 0;
  };
  const optionalNum = (label: string, v: string) =>
    v.trim() === "" ? null : num(label, v);

  const cats = {} as PricingSettings["categories"];
  for (const [slug, row] of Object.entries(categories) as [
    CollectionSlug,
    CategoryRow,
  ][]) {
    const name = names[slug] ?? slug;
    cats[slug] = {
      baseCents: money(`${name} base price`, row.base),
      minCents: money(`${name} min`, row.min),
      maxCents: money(`${name} max`, row.max),
      inSubscription: row.inSubscription,
      smallFactor: optionalNum(`${name} small factor`, row.smallFactor),
      unlimitedFactor: optionalNum(
        `${name} unlimited factor`,
        row.unlimitedFactor,
      ),
    };
  }
  const g = Object.fromEntries(
    GENERAL.map(({ key, label, money: isMoney }) => [
      key,
      isMoney ? money(label, general[key]) : num(label, general[key]),
    ]),
  ) as Record<GeneralKey, number>;

  const settings: PricingSettings = {
    categories: cats,
    complexityFactors: {
      simple: g.simple,
      standard: g.standard,
      complex: g.complex,
    },
    setFactorPerExtraPart: g.setFactorPerExtraPart,
    setFactorMax: g.setFactorMax,
    stepSurchargeCents: g.stepSurchargeCents,
    smallFactor: g.smallFactor,
    smallMinimumCents: g.smallMinimumCents,
    unlimitedFactor: g.unlimitedFactor,
    subscriptionMonthlyCents: g.subscriptionMonthlyCents,
    subscriptionYearlyCents: g.subscriptionYearlyCents,
    customFromCents: g.customFromCents,
  };
  if (errors.length === 0) errors.push(...validateSettings(settings, names));
  return { settings, errors };
}

export function PricingSettingsForm({
  initial,
  names,
  colors,
}: {
  initial: PricingSettings;
  names: Record<string, string>;
  colors: Record<string, string>;
}) {
  const [form, setForm] = useState(() => toForm(initial));
  const [message, setMessage] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const { settings, errors } = fromForm(form.categories, form.general, names);
  const valid = errors.length === 0;

  const setCategory = (slug: CollectionSlug, patch: Partial<CategoryRow>) => {
    setMessage(null);
    setForm((f) => ({
      ...f,
      categories: {
        ...f.categories,
        [slug]: { ...f.categories[slug], ...patch },
      },
    }));
  };
  const setGeneral = (key: GeneralKey, value: string) => {
    setMessage(null);
    setForm((f) => ({ ...f, general: { ...f.general, [key]: value } }));
  };

  const save = () =>
    startTransition(async () => {
      const result = await savePricingSettings(JSON.stringify(settings));
      if (result.ok) {
        setServerErrors([]);
        setMessage("Saved. New calculations use these values.");
      } else {
        setServerErrors(result.errors);
      }
    });

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-x-auto rounded-3xl glass">
        <table className="w-full min-w-[58rem] text-left text-sm">
          <thead className="text-ink/60 text-xs uppercase">
            <tr className="border-line border-b">
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Base price</th>
              <th className="p-4 font-semibold">Min</th>
              <th className="p-4 font-semibold">Max</th>
              <th className="p-4 font-semibold">Small ×</th>
              <th className="p-4 font-semibold">Unlimited ×</th>
              <th className="p-4 font-semibold">In subscription</th>
              <th className="p-4 font-semibold">Example (standard, single)</th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {(
              Object.entries(form.categories) as [CollectionSlug, CategoryRow][]
            ).map(([slug, row]) => {
              const preview = valid
                ? calculatePrices(settings, {
                    category: slug,
                    complexity: "standard",
                    isSet: false,
                    partCount: 1,
                    includesStep: false,
                  })
                : null;
              return (
                <tr key={slug}>
                  <td className="p-4 font-medium">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: colors[slug] }}
                        aria-hidden
                      />
                      {names[slug] ?? slug}
                    </span>
                  </td>
                  {(["base", "min", "max"] as const).map((field) => (
                    <td key={field} className="p-4">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row[field]}
                        onChange={(e) =>
                          setCategory(slug, { [field]: e.target.value })
                        }
                        aria-label={`${names[slug]} ${field}`}
                        className={INPUT}
                      />
                    </td>
                  ))}
                  {(["smallFactor", "unlimitedFactor"] as const).map((field) => (
                    <td key={field} className="p-4">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row[field]}
                        placeholder={form.general[field]}
                        onChange={(e) =>
                          setCategory(slug, { [field]: e.target.value })
                        }
                        aria-label={`${names[slug]} ${field}`}
                        title="Blank = the general factor below"
                        className={`${INPUT} w-20`}
                      />
                    </td>
                  ))}
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={row.inSubscription}
                      onChange={(e) =>
                        setCategory(slug, { inSubscription: e.target.checked })
                      }
                      aria-label={`${names[slug]} in subscription`}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="text-ink/80 p-4 whitespace-nowrap">
                    {preview
                      ? `${formatEuro(preview.personalCents)} / ${formatEuro(preview.smallCents)} / ${formatEuro(preview.unlimitedCents)}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-ink/60 -mt-4 text-xs">
        Small × / Unlimited ×: a category&apos;s own license factors. Leave
        blank to use the general factors below. Serious Games is sold to game
        studios, so its tiers are called Startup and Studio.
      </p>

      <div className="grid gap-4 rounded-3xl p-6 sm:grid-cols-2 lg:grid-cols-3 glass">
        {GENERAL.map(({ key, label, money }) => (
          <label
            key={key}
            className="flex items-center justify-between gap-3 text-sm font-medium"
          >
            {label}
            <span className="flex items-center gap-2">
              {money && <span className="text-ink/60">€</span>}
              <input
                type="text"
                inputMode="decimal"
                value={form.general[key]}
                onChange={(e) => setGeneral(key, e.target.value)}
                className={INPUT}
              />
            </span>
          </label>
        ))}
      </div>

      {(!valid || serverErrors.length > 0) && (
        <ul className="rounded-2xl border border-red-400 bg-red-400/15 p-4 text-sm">
          {[...errors, ...serverErrors].map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {message && <p className="text-sm font-medium">{message}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!valid || pending}
          className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover rounded-full px-6 py-3 text-sm font-semibold backdrop-blur-lg transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setForm(toForm(DEFAULT_PRICING_SETTINGS));
            setMessage("Defaults filled in — click Save to keep them.");
          }}
          className={BUTTON_SECONDARY}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
