import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/studio/guard";

export default async function StudioDashboardPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: orderCount },
    { count: customerCount },
    { data: drafts },
  ] = await Promise.all([
    supabase!.from("products").select("id", { count: "exact", head: true }),
    supabase!.from("orders").select("id", { count: "exact", head: true }),
    supabase!
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer"),
    supabase!
      .from("products")
      .select("id, title, category, created_at")
      .eq("publication_status", "draft")
      .order("created_at", { ascending: false }),
  ]);

  const stats = [
    { label: "Products", value: productCount ?? 0, href: "/studio/products" },
    { label: "Orders", value: orderCount ?? 0, href: "/studio/orders" },
    {
      label: "Customers",
      value: customerCount ?? 0,
      href: "/studio/customers",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-ink/60 mt-1 text-sm">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""} —
          you&apos;re managing 3DPIY as an admin. This is not what customers
          see.
        </p>
      </div>

      {drafts && drafts.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl p-6 glass">
          <p className="font-display text-lg font-semibold">
            {drafts.length} new product(s) waiting to go live
          </p>
          <p className="text-ink/60 text-sm">
            New uploads from the ingest folder arrive here as drafts. Check
            the texts, photos and prices, then set Status to Published.
          </p>
          <ul className="divide-line divide-y">
            {drafts.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/studio/products/${d.id}/edit`}
                  className="hover:text-brand-purple flex justify-between gap-4 py-2 text-sm"
                >
                  <span className="font-medium">{d.title}</span>
                  <span className="text-ink/60">
                    {d.category} · {new Date(d.created_at).toLocaleDateString("nl-NL")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="hover:bg-mist rounded-3xl p-6 glass"
          >
            <p className="text-ink/60 text-sm">{stat.label}</p>
            <p className="font-display mt-1 text-3xl font-bold">{stat.value}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/studio/products/new"
        className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg transition-colors inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        + New product
      </Link>
    </div>
  );
}
