import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lands here after a Supabase email link (signup confirmation or password
 * reset) is clicked. Exchanges the one-time code for a session, then
 * redirects to `next` (defaults to /account).
 *
 * If the exchange fails (link expired, already used, or opened in a
 * different browser than the one that requested it — the PKCE verifier
 * lives in that first browser's cookies), a password-reset link sends you
 * back to "forgot password" with an explanation instead of silently
 * landing on a reset form that can't save anything.
 *
 * Lives under /api so the next-intl middleware skips it (see src/proxy.ts
 * matcher) — this endpoint doesn't need a locale prefix.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  // Only same-site paths — never redirect to another host via ?next=.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  let ok = false;
  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      ok = !error;
    }
  }

  if (!ok && safeNext.startsWith("/auth/reset-password")) {
    return NextResponse.redirect(`${origin}/auth/forgot-password?expired=1`);
  }
  return NextResponse.redirect(`${origin}${safeNext}`);
}
