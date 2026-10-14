"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "./config";

/**
 * Browser client for Client Components (e.g. the sign-in/sign-up forms).
 * Returns null when Supabase isn't configured yet — callers must check.
 *
 * Not generic over Database: hand-rolled types can't express PostgREST's
 * nested `.select("a, b(c)")` embeds precisely. Once a real project exists,
 * run `supabase gen types` (see src/lib/supabase/types.ts) and reintroduce
 * `createBrowserClient<Database>` for full type safety.
 */
export function createClient() {
  if (!isSupabaseConfigured()) return null;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
