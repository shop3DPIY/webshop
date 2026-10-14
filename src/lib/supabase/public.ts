import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";

/**
 * Anon client with no cookie/session handling — safe to use anywhere,
 * including contexts with no HTTP request at all (generateStaticParams,
 * other build-time code), unlike src/lib/supabase/server.ts's client.
 *
 * Only for public, unauthenticated reads (the product catalog). RLS still
 * applies — this can never see unpublished products, session or not.
 */
export function createPublicClient() {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
