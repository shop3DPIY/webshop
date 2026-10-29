import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * How many purchases/downloads tie people to a design: order lines,
 * entitlements and free downloads. Above 0 the design can't be deleted,
 * only taken offline (see lifecycle.ts).
 */
export async function countOwners(productId: string): Promise<number> {
  const admin = createAdminClient();
  if (!admin) return 0;
  const counts = await Promise.all(
    (["order_items", "entitlements", "free_downloads"] as const).map(
      async (table) =>
        (
          await admin
            .from(table)
            .select("product_id", { count: "exact", head: true })
            .eq("product_id", productId)
        ).count ?? 0,
    ),
  );
  return counts.reduce((a, b) => a + b, 0);
}
