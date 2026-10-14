import { createClient } from "@/lib/supabase/server";

export default async function StudioCustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase!
    .from("profiles")
    .select("id, email, full_name, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Customers</h1>

      <div className="border-line divide-line divide-y rounded-3xl border">
        {customers && customers.length > 0 ? (
          customers.map((customer) => (
            <div key={customer.id} className="flex items-center justify-between gap-4 p-5 text-sm">
              <div>
                <p className="font-medium">{customer.full_name || customer.email}</p>
                <p className="text-ink/60">{customer.email}</p>
              </div>
              <p className="text-ink/60">{customer.created_at}</p>
            </div>
          ))
        ) : (
          <p className="text-ink/60 p-8 text-center text-sm">No customer accounts yet.</p>
        )}
      </div>
    </div>
  );
}
