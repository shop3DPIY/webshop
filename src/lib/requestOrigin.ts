import type { NextRequest } from "next/server";

/**
 * The address the visitor actually used (https://3dpiy.com, or
 * http://localhost:3000). On Netlify `request.url` is the internal deploy
 * host (main--….netlify.app) — redirecting there loses the visitor's
 * session and preview cookies, which belong to 3dpiy.com.
 */
export function requestOrigin(request: NextRequest | Request): string {
  const url = new URL(request.url);
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return url.origin;
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
    url.protocol.replace(":", "");
  return `${proto}://${host}`;
}
