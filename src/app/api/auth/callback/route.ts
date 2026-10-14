import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lands here after a Supabase email link (signup confirmation or password
 * reset) is clicked. Exchanges the one-time code for a session, then
 * redirects to `next` (defaults to /account).
 *
 * Lives under /api so the next-intl middleware skips it (see src/proxy.ts
 * matcher) — this endpoint doesn't need a locale prefix.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
