"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { TRACK_COOKIE, parseTrack } from "@/lib/config/track";
import { TRACK_EVENT } from "@/hooks/useCurrentTrack";

/**
 * Keeps <html data-track> (backdrop + button color, see globals.css) in
 * step with client-side navigation. The server sets it from the track
 * cookie, but <html> lives in the root layout, which Next.js doesn't
 * re-render when you click from /business to /shop or /about — so
 * without this those pages kept whatever track the first page load had.
 */
export function TrackSync() {
  const pathname = usePathname();

  useEffect(() => {
    let track: string | undefined;
    // "/shop?track=dolls" (the chooser's and the switcher's Shop link)
    // picks the Shop explicitly.
    const picked = parseTrack(new URLSearchParams(window.location.search).get("track") ?? undefined);
    if (picked) track = picked;
    else if (pathname === "/dolls" || pathname.startsWith("/dolls/")) track = "dolls";
    else if (pathname === "/business" || pathname.startsWith("/business/")) {
      track = "business";
    } else {
      track = document.cookie.match(new RegExp(`(?:^|; )${TRACK_COOKIE}=([^;]*)`))?.[1];
    }
    const parsed = parseTrack(track);
    if (parsed) document.documentElement.setAttribute("data-track", parsed);
    // Remember the track only on a real visit to /dolls or /business.
    // (The proxy used to set this cookie, but link prefetches pass through
    // the proxy too — the header's switcher prefetching /business flipped
    // the Shop visitor's cookie to Business, so Shop/About/Contact opened
    // in the Business look.)
    if (picked || pathname === "/business" || pathname.startsWith("/business/")) {
      document.cookie = `${TRACK_COOKIE}=${parsed}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      window.dispatchEvent(new Event(TRACK_EVENT));
    }
  }, [pathname]);

  return null;
}
