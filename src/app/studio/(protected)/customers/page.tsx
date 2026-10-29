import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatEuro } from "@/lib/pricing/calculate";

interface OrderLine {
  title: string;
  productId: string | null;
  tier: string | null;
  cents: number | null;
}
interface CustomerOrder {
  id: string;
  date: string;
  totalCents: number | null;
  lines: OrderLine[];
}
interface Customer {
  email: string;
  name: string | null;
  hasAccount: boolean;
  since: string;
  orders: CustomerOrder[];
  free: { title: string; productId: string; date: string }[];
}

const TIER = { personal: "Personal", small: "Startup / small", unlimited: "Studio / unlimited" } as Record<string, string>;
const date = (iso: string) => new Date(iso).toLocaleDateString("nl-NL");

/**
 * Everyone who has an account, bought something (also as a guest) or got
 * a free design — one row per email address, with each order and what
 * was in it. Read with the service-role client (admin-only page) so guest
 * orders and free downloads are included.
 */
export default async function StudioCustomersPage() {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: orders }, { data: free }, { data: products }] =
    await Promise.all([
      admin!.from("profiles").select("email, full_name, role, created_at"),
      admin!
        .from("orders")
        .select("id, buyer_email, total_cents, created_at, order_items(product_id, title, license_tier, price_cents)")
        .order("created_at", { ascending: false }),
      admin!.from("free_downloads").select("email, product_id, created_at"),
      admin!.from("products").select("id, title"),
    ]);

  const titles = new Map((products ?? []).map((p) => [p.id, p.title as string]));
  const byEmail = new Map<string, Customer>();
  const get = (email: string, since: string) => {
    const key = email.toLowerCase();
    let c = byEmail.get(key);
    if (!c) {
      c = { email: key, name: null, hasAccount: false, since, orders: [], free: [] };
      byEmail.set(key, c);
    }
    if (since < c.since) c.since = since;
    return c;
  };

  for (const p of profiles ?? []) {
    if (p.role === "admin" || !p.email) continue;
    const c = get(p.email, p.created_at);
    c.hasAccount = true;
    c.name = p.full_name;
  }
  for (const o of orders ?? []) {
    if (!o.buyer_email) continue;
    const items = (o.order_items ?? []) as {
      product_id: string | null;
      title: string | null;
      license_tier: string | null;
      price_cents: number | null;
    }[];
    get(o.buyer_email, o.created_at).orders.push({
      id: o.id,
      date: o.created_at,
      totalCents: o.total_cents,
      lines: items.map((i) => ({
        productId: i.product_id,
        title:
          (i.product_id && titles.get(i.product_id)) || i.title || "(deleted product)",
        tier: i.license_tier,
        cents: i.price_cents,
      })),
    });
  }
  for (const f of free ?? []) {
    get(f.email, f.created_at).free.push({
      productId: f.product_id,
      title: titles.get(f.product_id) ?? "(deleted product)",
      date: f.created_at,
    });
  }

  const customers = [...byEmail.values()].sort((a, b) => (a.since < b.since ? 1 : -1));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Customers</h1>
        <p className="text-ink/60 mt-1 text-sm">
          Everyone with an account, a purchase (also without an account) or a
          free download. Click someone to see what they got, per order.
        </p>
      </div>

      <div className="divide-line divide-y rounded-3xl glass">
        {customers.length > 0 ? (
          customers.map((c) => {
            const spent = c.orders.reduce((sum, o) => sum + (o.totalCents ?? 0), 0);
            return (
              <details key={c.email} className="group p-5 text-sm">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.name || c.email}</p>
                    <p className="text-ink/60">{c.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {c.orders.length > 0 && (
                      <span className="rounded-full border border-emerald-300 bg-emerald-500/40 px-3 py-1 font-semibold">
                        Bought · {c.orders.length} order(s)
                      </span>
                    )}
                    {c.free.length > 0 && (
                      <span className="rounded-full border border-sky-300 bg-sky-500/40 px-3 py-1 font-semibold">
                        Free download · {c.free.length}
                      </span>
                    )}
                    {c.orders.length === 0 && c.free.length === 0 && (
                      <span className="border-line rounded-full border px-3 py-1">
                        Account only
                      </span>
                    )}
                    <span className="border-line rounded-full border px-3 py-1">
                      {c.hasAccount ? "Has account" : "No account"}
                    </span>
                    <span className="text-ink/60">since {date(c.since)}</span>
                    <span className="font-display ml-2 min-w-20 text-right text-base font-bold">
                      {formatEuro(spent)}
                    </span>
                  </div>
                </summary>

                <div className="mt-4 flex flex-col gap-3">
                  {c.orders.map((o) => (
                    <div key={o.id} className="rounded-2xl p-4 glass">
                      <p className="text-ink/60 mb-2 text-xs">
                        Order of {date(o.date)}
                        {o.totalCents != null && ` · ${formatEuro(o.totalCents)}`}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {o.lines.map((l, i) => (
                          <li key={i} className="flex justify-between gap-4">
                            {l.productId ? (
                              <Link
                                href={`/studio/products/${l.productId}/edit`}
                                className="hover:text-brand-purple font-medium"
                              >
                                {l.title}
                              </Link>
                            ) : (
                              <span>{l.title}</span>
                            )}
                            <span className="text-ink/60">
                              {l.tier ? (TIER[l.tier] ?? l.tier) : ""}
                              {l.cents != null && ` · ${formatEuro(l.cents)}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {c.free.length > 0 && (
                    <div className="rounded-2xl p-4 glass">
                      <p className="text-ink/60 mb-2 text-xs">Free downloads</p>
                      <ul className="flex flex-col gap-1">
                        {c.free.map((f) => (
                          <li key={f.productId} className="flex justify-between gap-4">
                            <span className="font-medium">{f.title}</span>
                            <span className="text-ink/60">{date(f.date)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.orders.length === 0 && c.free.length === 0 && (
                    <p className="text-ink/60">Account only — nothing bought yet.</p>
                  )}
                </div>
              </details>
            );
          })
        ) : (
          <p className="text-ink/60 p-8 text-center text-sm">No customers yet.</p>
        )}
      </div>
    </div>
  );
}
