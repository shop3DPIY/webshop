import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmSubmitButton, STUDIO_CONFIRM } from "@/components/ui/ConfirmDialog";
import { formatEuro } from "@/lib/pricing/calculate";
import {
  createDiscount,
  deleteDiscount,
  listDiscounts,
  type PolarDiscount,
} from "@/lib/commerce/polar/discounts";

const FIELD = "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

const ERRORS: Record<string, string> = {
  "not-configured": "Polar isn't connected (POLAR_ACCESS_TOKEN).",
  code: "The code needs at least 3 letters/digits.",
  value: "Fill in a discount: a percentage from 1 to 100, or an amount in euros.",
  "not-listed": "That design isn't listed on Polar yet — save it first.",
  polar: "Polar refused the code",
  delete: "Polar couldn't delete that code.",
};

function describe(d: PolarDiscount) {
  return d.type === "percentage"
    ? `${(d.basis_points ?? 0) / 100}% off`
    : `${formatEuro(d.amount ?? 0)} off`;
}

/**
 * Discount codes, created in Polar from here. Buyers type the code in
 * Polar's checkout. Polar's own list is the source of truth.
 */
export default async function StudioDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string; created?: string; deleted?: string }>;
}) {
  const { error, detail, created, deleted } = await searchParams;
  let discounts: PolarDiscount[] = [];
  let loadError: string | null = null;
  try {
    discounts = await listDiscounts();
  } catch (e) {
    loadError = (e as Error).message;
  }
  const { data: products } = await createAdminClient()!
    .from("products")
    .select("id, title, commerce_product_ids, is_free, publication_status")
    .order("title");
  const listed = (products ?? []).filter(
    (p) =>
      !p.is_free &&
      p.publication_status !== "archived" &&
      Object.values(p.commerce_product_ids ?? {}).some(Boolean),
  );
  const isProduction = process.env.POLAR_SERVER !== "sandbox";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Discounts</h1>
        <p className="text-ink/60 mt-1 max-w-2xl text-sm">
          Codes buyers type in at checkout. They&apos;re created in Polar
          {isProduction ? "" : " (sandbox — test codes)"}; one use per order.
        </p>
      </div>

      {(error || created || deleted) && (
        <p
          role="status"
          className={`w-fit rounded-full border px-4 py-2 text-sm font-medium ${
            error ? "border-red-300 text-red-200" : "border-brand-purple bg-brand-purple/25"
          }`}
        >
          {error
            ? `${ERRORS[error] ?? "Something went wrong."}${detail ? `: ${detail}` : ""}`
            : created
              ? `✓ Code ${created} created.`
              : "✓ Code deleted."}
        </p>
      )}

      <form action={createDiscount} className="grid max-w-3xl gap-4 rounded-3xl p-6 glass sm:grid-cols-2">
        <h2 className="font-display text-lg font-semibold sm:col-span-2">New code</h2>
        <label className={LABEL}>
          Code
          <input name="code" className={FIELD} placeholder="Empty = make one up, e.g. 3DPIY-K7QX2M" />
        </label>
        <label className={LABEL}>
          Name (shown at checkout)
          <input name="name" className={FIELD} placeholder="e.g. Newsletter welcome" />
        </label>
        <label className={LABEL}>
          Kind
          <select name="type" className={FIELD} defaultValue="percentage">
            <option value="percentage">Percentage off</option>
            <option value="fixed">Euro amount off</option>
          </select>
        </label>
        <label className={LABEL}>
          Discount
          <input name="value" required inputMode="decimal" className={FIELD} placeholder="10 (= 10% or € 10)" />
        </label>
        <label className={LABEL}>
          Valid until (optional)
          <input type="date" name="endsAt" className={FIELD} />
        </label>
        <label className={LABEL}>
          Max uses in total (optional)
          <input type="number" min={1} name="maxRedemptions" className={FIELD} />
        </label>
        <label className={LABEL}>
          Only for one design (optional)
          <select name="productId" className={FIELD} defaultValue="">
            <option value="">All designs</option>
            {listed.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium">
          <input type="checkbox" name="oncePerCustomer" className="h-4 w-4" defaultChecked />
          Once per customer
        </label>
        <button
          type="submit"
          className="border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover w-fit rounded-full border px-6 py-3 text-sm font-semibold transition-colors sm:col-span-2"
        >
          Create code
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Codes ({discounts.length})</h2>
        {loadError && <p className="text-sm text-red-200">Couldn&apos;t load from Polar: {loadError}</p>}
        <div className="divide-line divide-y rounded-3xl glass">
          {discounts.length === 0 ? (
            <p className="text-ink/60 p-8 text-center text-sm">No codes yet.</p>
          ) : (
            discounts.map((d) => {
              const ended = d.ends_at && new Date(d.ends_at) < new Date();
              const usedUp = d.max_redemptions != null && d.redemptions_count >= d.max_redemptions;
              return (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 p-5 text-sm">
                  <div>
                    <p className="font-semibold">
                      <span className="font-mono">{d.code ?? "(no code)"}</span> · {describe(d)}
                      {(ended || usedUp) && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800">
                          {ended ? "Expired" : "Used up"}
                        </span>
                      )}
                    </p>
                    <p className="text-ink/60">
                      {d.name} · used {d.redemptions_count}
                      {d.max_redemptions != null ? ` of ${d.max_redemptions}` : ""}×
                      {d.ends_at &&
                        ` · until ${new Date(d.ends_at).toLocaleDateString("nl-NL", { dateStyle: "medium" })}`}
                      {d.products.length > 0 &&
                        ` · only: ${[...new Set(d.products.map((p) => p.name.split(" — ")[0]))].join(", ")}`}
                    </p>
                  </div>
                  <form action={deleteDiscount}>
                    <input type="hidden" name="id" value={d.id} />
                    <ConfirmSubmitButton
                      className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/70 hover:text-white"
                      labels={{
                        title: `Delete code ${d.code ?? d.name}?`,
                        body: "Buyers can no longer use it. Orders that already used it are not affected.",
                        ...STUDIO_CONFIRM,
                      }}
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
