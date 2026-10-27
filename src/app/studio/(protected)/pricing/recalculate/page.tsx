import Link from "next/link";
import { COLLECTIONS, type CollectionSlug } from "@/lib/config/colors";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyRecalculation } from "@/lib/studio/actions";
import {
  PRICE_TIERS,
  calculatePrices,
  formatEuro,
  tierCents,
  type Complexity,
} from "@/lib/pricing/calculate";
import { getPricingSettings, storedPrices } from "@/lib/pricing/settings";

const TIER_SHORT = { personal: "P", small: "S", unlimited: "U" } as const;

/**
 * Shows, per product, its current prices next to what the current price
 * table would make them. Ticked products are updated on submit. Unchanged
 * products, and products with hand-typed prices, start unticked.
 */
export default async function RecalculatePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const { updated } = await searchParams;
  const settings = await getPricingSettings();
  const admin = createAdminClient();
  const { data: products } = admin
    ? await admin.from("products").select("*").order("title")
    : { data: [] };

  const rows = (products ?? []).map((p) => {
    const result = calculatePrices(settings, {
      category: (p.category in COLLECTIONS
        ? p.category
        : "other") as CollectionSlug,
      complexity: p.complexity as Complexity,
      isSet: p.is_set,
      partCount: p.part_count,
      includesStep: p.includes_step,
    });
    const current = storedPrices(p).chosen;
    const next = Object.fromEntries(
      PRICE_TIERS.map((t) => [t, tierCents(result, t)]),
    );
    const changed = PRICE_TIERS.some((t) => current[t] !== next[t]);
    const overridden = (p.price_overrides ?? []).length > 0;
    return {
      id: p.id as string,
      title: p.title as string,
      current,
      next,
      changed,
      overridden,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/studio/pricing"
          className="text-ink/60 hover:text-ink text-sm"
        >
          ← Pricing
        </Link>
        <h1 className="font-display mt-2 text-2xl font-bold">
          Recalculate prices
        </h1>
        <p className="text-ink/60 mt-1 max-w-2xl text-sm">
          Current price → new price from the saved price table (P = Personal, S
          = Small, U = Unlimited). Ticked products get the new prices;
          hand-typed prices on them are replaced too. Polar is updated
          automatically.
        </p>
      </div>

      {updated && (
        <p className="rounded-2xl p-4 text-sm font-medium glass">
          {updated} product(s) updated.
        </p>
      )}

      <form action={applyRecalculation} className="flex flex-col gap-6">
        <div className="divide-line divide-y rounded-3xl glass">
          {rows.length === 0 && (
            <p className="text-ink/60 p-8 text-center text-sm">
              No products yet.
            </p>
          )}
          {rows.map((r) => (
            <label
              key={r.id}
              className="hover:bg-mist flex flex-wrap items-center gap-4 p-5 text-sm"
            >
              <input
                type="checkbox"
                name="productId"
                value={r.id}
                defaultChecked={r.changed && !r.overridden}
                className="h-4 w-4"
              />
              <span className="min-w-48 flex-1 font-medium">
                {r.title}
                {r.overridden && (
                  <span className="border-brand-purple bg-brand-purple/15 ml-2 rounded-full border px-2 py-0.5 text-xs font-semibold">
                    overridden
                  </span>
                )}
                {!r.changed && (
                  <span className="text-ink/60 ml-2 text-xs">unchanged</span>
                )}
              </span>
              <span className="text-ink/80 flex flex-wrap gap-4">
                {PRICE_TIERS.map((t) => (
                  <span key={t} className="whitespace-nowrap">
                    {TIER_SHORT[t]}:{" "}
                    {r.current[t] == null ? "—" : formatEuro(r.current[t]!)}
                    {r.current[t] !== r.next[t] && (
                      <span className="font-semibold">
                        {" "}
                        → {formatEuro(r.next[t])}
                      </span>
                    )}
                  </span>
                ))}
              </span>
            </label>
          ))}
        </div>
        {rows.length > 0 && (
          <button
            type="submit"
            className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover w-fit rounded-full px-6 py-3 text-sm font-semibold backdrop-blur-lg transition-colors"
          >
            Update ticked products
          </button>
        )}
      </form>
    </div>
  );
}
