import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "./config";

/**
 * Refreshes the Supabase auth session cookie on every request and writes
 * it onto `response`. Composed into src/proxy.ts alongside the next-intl
 * middleware — see that file for why they run together.
 *
 * No-ops when Supabase isn't configured yet.
 */
export async function updateSupabaseSession(request: NextRequest, response: NextResponse) {
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Required: touching getUser() is what actually refreshes the token.
  await supabase.auth.getUser();

  return response;
}
