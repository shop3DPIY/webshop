import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/requestOrigin";

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
  const { searchParams } = new URL(request.url);
  const origin = requestOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  // Only same-site paths — never redirect to another host via ?next=.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  // Mail templates with {{ .TokenHash }} (SETUP.md): don't spend the token
  // on this GET — mail scanners open links too — but hand it to the
  // confirm page, whose button verifies it in whatever browser this is.
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && type) {
    const confirm = new URL("/auth/confirm", origin);
    confirm.searchParams.set("token_hash", tokenHash);
    confirm.searchParams.set("type", type);
    confirm.searchParams.set("next", safeNext);
    return NextResponse.redirect(confirm);
  }

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
  // A signup link opened in another browser (phone, mail app): Supabase
  // has confirmed the address before sending us here, only the sign-in
  // part failed — say so instead of a bare sign-in page.
  if (!ok && searchParams.get("from") === "signup") {
    return NextResponse.redirect(`${origin}/auth/sign-in?confirmed=1`);
  }
  return NextResponse.redirect(`${origin}${safeNext}`);
}
