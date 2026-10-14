import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "./config";

/**
 * Service-role client — bypasses Row Level Security entirely.
 *
 * NEVER import this in a Client Component or expose SUPABASE_SERVICE_ROLE_KEY
 * to the browser. Only used server-side for: the Payhip webhook (writing
 * orders/entitlements), the admin studio's product writes, and generating
 * signed download URLs after verifying entitlement.
 *
 * Returns null when not configured yet — callers must check.
 */
export function createAdminClient() {
  if (!isSupabaseAdminConfigured()) return null;

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
