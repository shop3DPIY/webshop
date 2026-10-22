import type { Track } from "@/lib/config/track";

/**
 * Tells globals.css which track this page belongs to (via
 * `:root:has([data-track-page])`), so the backdrop and button color are
 * right on the very first visit — <html data-track> comes from the track
 * cookie, which proxy.ts only sets on the response, one render too late.
 */
export function TrackMarker({ track }: { track: Track | undefined }) {
  if (!track) return null;
  return <span hidden data-track-page={track} />;
}
