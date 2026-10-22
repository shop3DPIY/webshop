import Link from "next/link";
import { COLLECTIONS } from "@/lib/config/colors";
import { PricingSettingsForm } from "@/components/studio/PricingSettingsForm";
import { COLLECTION_NAMES, getPricingSettings } from "@/lib/pricing/settings";

export default async function PricingSettingsPage() {
  const settings = await getPricingSettings();
  const colors = Object.fromEntries(Object.values(COLLECTIONS).map((c) => [c.slug, c.color]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Pricing</h1>
          <p className="text-ink/60 mt-1 max-w-2xl text-sm">
            Personal = base price × complexity (+ STEP surcharge), × set factor for a set,
            kept between min and max and rounded to € 0,50. Small = Personal × small factor
            (at least the small minimum). Unlimited = Small × unlimited factor, rounded down to
            € 5. Changes apply to new calculations; existing prices stay until you recalculate
            them.
          </p>
        </div>
        <Link
          href="/studio/pricing/recalculate"
          className="border-line bg-mist hover:border-brand-purple hover:bg-brand-purple/45 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Recalculate prices →
        </Link>
      </div>
      <PricingSettingsForm initial={settings} names={COLLECTION_NAMES} colors={colors} />
    </div>
  );
}
