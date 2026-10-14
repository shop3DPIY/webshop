import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSupabaseSession } from "./lib/supabase/middleware";
import { getSiteMode, isAllowedInGatedMode } from "./lib/config/siteMode";

const intlMiddleware = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Both /studio and /coming-soon live outside the [locale] route tree
  // entirely (see their own layout.tsx files) — next-intl's middleware
  // would otherwise assume they need a locale segment and rewrite them to
  // a path that doesn't exist (404). /studio also always stays reachable
  // regardless of site mode, so the owner can keep preparing products
  // while the public site shows "coming soon".
  const isStudioRoute = pathname.startsWith("/studio");
  const isComingSoonRoute = pathname === "/coming-soon";
  const bypassesIntl = isStudioRoute || isComingSoonRoute;

  if (!isStudioRoute) {
    const mode = getSiteMode();
    if (mode !== "live" && !isAllowedInGatedMode(pathname, mode)) {
      const gateUrl = request.nextUrl.clone();
      gateUrl.pathname = "/coming-soon";
      const response = NextResponse.rewrite(gateUrl);
      return updateSupabaseSession(request, response);
    }
  }

  const response = bypassesIntl ? NextResponse.next() : intlMiddleware(request);

  return updateSupabaseSession(request, response);
}

export const config = {
  // Skip API routes, Next internals, static files and anything with a file extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
