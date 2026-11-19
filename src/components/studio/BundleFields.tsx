"use client";

import { useEffect, useRef, useState } from "react";
import { COLLECTIONS, type CollectionSlug } from "@/lib/config/colors";
import {
  BUNDLE_DISCOUNT,
  bundlePriceCents,
  centsToInput,
  formatEuro,
  sellableTiers,
  tierNames,
  type PriceTier,
} from "@/lib/pricing/calculate";

const FIELD =
  "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";

export interface BundleCandidate {
  id: string;
  title: string;
  category: string;
  status: string;
  prices: Partial<Record<PriceTier, number | null>>;
}

/**
 * "This is a bundle": pick the designs it contains (same track as the
 * bundle's collection). Buyers get every included design in their
 * library. The suggested price is the sum minus BUNDLE_DISCOUNT; type
 * your own to override. While on, the normal pricing tile is hidden —
 * a bundle's price comes from its contents, not from complexity.
 *
 * Saved by persistProduct from bundleMode / isBundle / bundleProductIds /
 * bundle_price_<tier>.
 */
export function BundleFields({
  candidates,
  initialIds,
  initialCategory,
  initialPrices,
}: {
  candidates: BundleCandidate[];
  initialIds: string[];
  initialCategory: string;
  /** Stored chosen prices of an existing bundle */
  initialPrices: Partial<Record<PriceTier, number | null>>;
}) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const [on, setOn] = useState(initialIds.length > 0);
  const [ids, setIds] = useState<string[]>(initialIds);
  const [category, setCategory] = useState(initialCategory);
  const [typed, setTyped] = useState<Partial<Record<PriceTier, string>>>(() =>
    Object.fromEntries(
      Object.entries(initialPrices)
        .filter(([, cents]) => cents != null)
        .map(([tier, cents]) => [tier, centsToInput(cents as number)]),
    ),
  );

  // Follow the Collection select of the surrounding form.
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target.name === "category") setCategory(target.value);
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);

  // Hide the normal pricing tile while this is a bundle.
  useEffect(() => {
    const tile = ref.current?.form?.querySelector<HTMLElement>("[data-pricing-tile]");
    if (tile) tile.hidden = on;
  }, [on]);

  const track = COLLECTIONS[category as CollectionSlug]?.track;
  const options = candidates.filter(
    (c) => COLLECTIONS[c.category as CollectionSlug]?.track === track,
  );
  const included = options.filter((c) => ids.includes(c.id));
  const tiers = sellableTiers(category);
  const names = tierNames(category);
  const sum = (tier: PriceTier) =>
    included.reduce((total, c) => total + (c.prices[tier] ?? 0), 0);

  return (
    <fieldset ref={ref} className="flex flex-col gap-4">
      <input type="hidden" name="bundleMode" value="1" />
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          name="isBundle"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
          className="h-4 w-4"
        />
        This is a bundle of other designs
      </label>
      {on && (
        <>
          <p className="text-ink text-sm">
            Buyers get every design below in their library. A bundle needs no
            files of its own. Only designs from the same track as the
            collection above can go in.
          </p>
          {options.length === 0 ? (
            <p className="text-sm">No other designs in this track yet.</p>
          ) : (
            <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-2xl border border-line p-3">
              {options.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="bundleProductIds"
                    value={c.id}
                    checked={ids.includes(c.id)}
                    onChange={(e) =>
                      setIds((list) =>
                        e.target.checked
                          ? [...list, c.id]
                          : list.filter((x) => x !== c.id),
                      )
                    }
                    className="h-4 w-4"
                  />
                  <span className="flex-1">
                    {c.title}
                    {c.status !== "published" && (
                      <span className="text-ink"> ({c.status})</span>
                    )}
                  </span>
                  <span className="text-ink text-xs">
                    {c.prices.personal != null ? formatEuro(c.prices.personal) : "—"}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">
              Bundle price ({included.length} design{included.length === 1 ? "" : "s"})
            </h3>
            {tiers.map((tier) => {
              const suggestion = included.length > 0 ? bundlePriceCents(sum(tier)) : null;
              return (
                <label key={tier} className="flex flex-col gap-1.5 text-sm font-medium">
                  {names[tier]}
                  <input
                    type="text"
                    inputMode="decimal"
                    name={`bundle_price_${tier}`}
                    value={typed[tier] ?? ""}
                    placeholder={suggestion != null ? centsToInput(suggestion) : ""}
                    onChange={(e) => setTyped((t) => ({ ...t, [tier]: e.target.value }))}
                    className={FIELD}
                  />
                  <span className="text-ink text-xs font-normal">
                    {suggestion != null
                      ? `Separately ${formatEuro(sum(tier))} → suggested ${formatEuro(suggestion)} (−${Math.round(BUNDLE_DISCOUNT * 100)}%). Leave empty to use the suggestion.`
                      : "Pick designs first."}
                  </span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </fieldset>
  );
}
