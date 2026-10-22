import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEuro } from "@/lib/pricing/calculate";

export default async function StudioProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase!
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <Link
          href="/studio/products/new"
          className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg transition-colors rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          + New product
        </Link>
      </div>

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
                    {product.price_small_cents != null ? formatEuro(product.price_small_cents) : "—"} · U{" "}
                    {product.price_unlimited_cents != null
                      ? formatEuro(product.price_unlimited_cents)
                      : "—"}
                  </p>
                )}
              </div>
              <span className="border-line rounded-full border px-3 py-1 text-xs capitalize">
                {product.publication_status}
              </span>
            </Link>
          ))
        ) : (
          <p className="text-ink/60 p-8 text-center text-sm">No products yet.</p>
        )}
      </div>
    </div>
  );
}
