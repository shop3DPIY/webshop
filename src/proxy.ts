import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSupabaseSession } from "./lib/supabase/middleware";
import {
  PREVIEW_COOKIE,
  PREVIEW_PARAM,
  getPreviewSecret,
  getSiteMode,
  isAllowedInGatedMode,
} from "./lib/config/siteMode";
import { TRACK_COOKIE } from "./lib/config/track";

const intlMiddleware = createIntlMiddleware(routing);

const TRACK_PATH_RE = /^\/(?:nl\/)?(dolls|business)(?:\/|$)/;

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

  // Secret preview link (see siteMode.ts): ?preview=<secret> turns the
  // preview cookie on, ?preview=off turns it off — then reload the same
  // URL without the parameter so it doesn't linger in the address bar.
  const previewSecret = getPreviewSecret();
  const previewParam = request.nextUrl.searchParams.get(PREVIEW_PARAM);
  if (previewSecret && previewParam !== null) {
    const clean = request.nextUrl.clone();
    clean.searchParams.delete(PREVIEW_PARAM);
    const response = NextResponse.redirect(clean);
    if (previewParam === previewSecret) {
      response.cookies.set(PREVIEW_COOKIE, previewSecret, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
      });
    } else if (previewParam === "off") {
      response.cookies.delete(PREVIEW_COOKIE);
    }
    return response;
  }
  const isPreviewing =
    previewSecret !== null && request.cookies.get(PREVIEW_COOKIE)?.value === previewSecret;

  if (!isStudioRoute && !isPreviewing) {
    const mode = getSiteMode();
    if (mode !== "live" && !isAllowedInGatedMode(pathname, mode)) {
      const gateUrl = request.nextUrl.clone();
      gateUrl.pathname = "/coming-soon";
      const response = NextResponse.rewrite(gateUrl);
      return updateSupabaseSession(request, response);
    }
  }

  const response = bypassesIntl ? NextResponse.next() : intlMiddleware(request);

  // Visiting either track's pages (via the chooser or a direct/bookmarked
  // link) remembers that choice, so a later visit to "/" skips straight to
  // it — the switcher on each track's pages is what keeps the other track
  // reachable instead of trapping visitors.
  const trackMatch = pathname.match(TRACK_PATH_RE);
  if (trackMatch) {
    response.cookies.set(TRACK_COOKIE, trackMatch[1], {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return updateSupabaseSession(request, response);
}

export const config = {
  // Skip API routes, Next internals, static files and anything with a file extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
