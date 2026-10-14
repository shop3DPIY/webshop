import { createClient } from "@/lib/supabase/server";

export default async function StudioOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase!
    .from("orders")
    .select("id, payhip_order_id, buyer_email, total_cents, currency, customer_id, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Orders</h1>

      <div className="border-line divide-line divide-y rounded-3xl border">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-4 p-5 text-sm">
              <div>
                <p className="font-medium">{order.payhip_order_id}</p>
                <p className="text-ink/60">
                  {order.buyer_email} · {order.created_at}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!order.customer_id && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">
                    Unclaimed
                  </span>
                )}
                {order.total_cents != null && (
                  <p className="font-medium">
                    {(order.total_cents / 100).toFixed(2)} {order.currency}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-ink/60 p-8 text-center text-sm">
            No orders yet — these sync in automatically from the Payhip webhook once it&apos;s configured.
          </p>
        )}
      </div>
    </div>
  );
}
