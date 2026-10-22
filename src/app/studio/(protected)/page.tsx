import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/studio/guard";

export default async function StudioDashboardPage() {
  const { profile } = await requireAdmin();
  const supabase = await createClient();

  const [{ count: productCount }, { count: orderCount }, { count: customerCount }] = await Promise.all([
    supabase!.from("products").select("id", { count: "exact", head: true }),
    supabase!.from("orders").select("id", { count: "exact", head: true }),
    supabase!.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
  ]);

  const stats = [
    { label: "Products", value: productCount ?? 0, href: "/studio/products" },
    { label: "Orders", value: orderCount ?? 0, href: "/studio/orders" },
    { label: "Customers", value: customerCount ?? 0, href: "/studio/customers" },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-ink/60 mt-1 text-sm">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""} — you&apos;re managing
          3DPIY as an admin. This is not what customers see.
        </p>
      </div>

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
        className="bg-action text-on-action hover:bg-action-hover hover:text-on-action-hover transition-colors inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        + New product
      </Link>
    </div>
  );
}
