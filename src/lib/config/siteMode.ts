/**
 * Controls how much of the public site is reachable — the staged-launch
 * switch. Set NEXT_PUBLIC_SITE_MODE in the hosting provider's env vars
 * (not needed locally; defaults to "live" so local dev always sees the
 * full site).
 *
 *   "coming-soon" — only the coming-soon page. Visitors can't reach
 *                    anything else, not even by typing a direct URL
 *                    (enforced in proxy.ts). The owner can still sign in
 *                    at /auth/sign-in (never linked from the coming-soon
 *                    page in this mode) to reach 3DPIY Studio — sign-up
 *                    stays blocked, so the public has no way in.
 *   "waitlist"     — coming-soon page + sign up / sign in / account. The
 *                    rest of the site (shop, business, about, ...) is
 *                    still unreachable.
 *   "live"         — no gating. The full site (default).
 */
export type SiteMode = "coming-soon" | "waitlist" | "live";

export function getSiteMode(): SiteMode {
  const mode = process.env.NEXT_PUBLIC_SITE_MODE;
  if (mode === "coming-soon" || mode === "waitlist") return mode;
  return "live";
}

const LOCALE_PREFIX_RE = /^\/(nl)(\/|$)/;

function stripLocalePrefix(pathname: string): string {
  return pathname.replace(LOCALE_PREFIX_RE, "/");
}

// Always reachable in any gated mode — the owner needs a way to sign in
// (and recover a lost password) to reach /studio even when the public
// site is showing nothing but the coming-soon page.
const ALWAYS_ALLOWED_PATHS = ["/auth/sign-in", "/auth/forgot-password", "/auth/reset-password"];

/** Used by proxy.ts to decide whether a request may pass through as-is. */
export function isAllowedInGatedMode(pathname: string, mode: SiteMode): boolean {
  const path = stripLocalePrefix(pathname);
  if (path === "/coming-soon") return true;
  if (ALWAYS_ALLOWED_PATHS.includes(path)) return true;
  // The manage/unsubscribe link in newsletters must always work.
  if (path.startsWith("/newsletter/")) return true;
  if (mode === "waitlist") {
    if (path === "/account" || path === "/auth/sign-up") return true;
  }
  return false;
}

/**
 * Secret preview link for gated modes: visiting any page with
 * `?preview=<SITE_PREVIEW_SECRET>` sets a cookie that shows the full site
 * in that browser (for ~30 days); `?preview=off` removes it again. Set
 * SITE_PREVIEW_SECRET in Netlify's env vars (server-only — not
 * NEXT_PUBLIC_, so it never reaches the browser bundle). Without it set,
 * previewing is simply off.
 */
export const PREVIEW_COOKIE = "site_preview";
export const PREVIEW_PARAM = "preview";

export function getPreviewSecret(): string | null {
  const secret = process.env.SITE_PREVIEW_SECRET;
  return secret && secret.length >= 8 ? secret : null;
}
