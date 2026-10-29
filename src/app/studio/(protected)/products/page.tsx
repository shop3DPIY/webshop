import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEuro } from "@/lib/pricing/calculate";
import { syncAllProductsToPolar } from "@/lib/studio/actions";

const TABS = [
  { status: "published", label: "Live" },
  { status: "draft", label: "Not live yet" },
  { status: "archived", label: "Offline" },
] as const;

export default async function StudioProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    commerceError?: string;
    synced?: string;
    deleted?: string;
    tab?: string;
  }>;
}) {
  const { commerceError, synced, deleted, tab: tabParam } = await searchParams;
  const supabase = await createClient();
  const { data: all } = await supabase!
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  const count = (status: string) =>
    (all ?? []).filter((p) => p.publication_status === status).length;
  // Default to "Not live yet" when something is waiting there (new
  // uploads from the ingest folder land as drafts), else "Live".
  const tab = TABS.some((t) => t.status === tabParam)
    ? tabParam!
    : count("draft") > 0
      ? "draft"
      : "published";
  const products = (all ?? []).filter((p) => p.publication_status === tab);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-3">
          <form action={syncAllProductsToPolar}>
            <button
              type="submit"
              className="border-line hover:bg-mist rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Sync with Polar
            </button>
          </form>
          <Link
            href="/studio/products/new"
            className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg transition-colors rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            + New product
          </Link>
        </div>
      </div>

      {commerceError && (
        <p className="rounded-2xl bg-amber-100 p-4 text-sm font-medium text-amber-900">
          Saved, but Polar couldn&apos;t be updated: {commerceError}. It will
          retry on the next save, or use &ldquo;Sync with Polar&rdquo;.
        </p>
      )}
      {deleted && (
        <p className="rounded-2xl p-4 text-sm font-medium glass">
          Product deleted.
        </p>
      )}
      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.status}
            href={`/studio/products?tab=${t.status}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.status
                ? "border-action bg-action text-on-action"
                : "border-line hover:bg-mist"
            }`}
          >
            {t.label} ({count(t.status)})
          </Link>
        ))}
      </nav>
      {tab === "archived" && (
        <p className="text-ink/60 text-sm">
          Offline designs aren&apos;t in the shop or on Polar any more; buyers
          still have them in their library.
        </p>
      )}
      {synced && (
        <p className="rounded-2xl p-4 text-sm font-medium glass">
          {synced} product(s) synced with Polar.
        </p>
      )}

      <div className="divide-line divide-y rounded-3xl glass">
        {products && products.length > 0 ? (
          products.map((product) => (
            <Link
              key={product.id}
              href={`/studio/products/${product.id}/edit`}
              className="hover:bg-mist flex items-center justify-between gap-4 p-5 text-sm"
            >
              <div>
                <p className="font-medium">{product.title}</p>
                <p className="text-ink/60">
                  {product.category} · v{product.version}
                </p>
                {product.price_cents != null && (
                  <p className="text-ink/60 text-xs">
                    P {formatEuro(product.price_cents)} · S{" "}
                    {product.price_small_cents != null
                      ? formatEuro(product.price_small_cents)
                      : "—"}{" "}
                    · U{" "}
                    {product.price_unlimited_cents != null
                      ? formatEuro(product.price_unlimited_cents)
                      : "—"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {Object.values(product.commerce_product_ids ?? {}).some(
                  Boolean,
                ) && (
                  <span className="border-line rounded-full border px-3 py-1 text-xs">
                    On Polar
                  </span>
                )}
                <span className="border-line rounded-full border px-3 py-1 text-xs capitalize">
                  {product.publication_status}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-ink/60 p-8 text-center text-sm">
            Nothing here.
          </p>
        )}
      </div>
    </div>
  );
}
