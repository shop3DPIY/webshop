/**
 * Supabase powers accounts, the customer download library and the admin
 * studio. It is NOT required for the rest of the site (Shop, Business,
 * About, Contact, product pages) — those work entirely without it.
 *
 * Until a real Supabase project exists and these env vars are set, every
 * account/admin page shows a "not connected yet" state instead of
 * crashing. See SETUP.md for the exact activation steps.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
