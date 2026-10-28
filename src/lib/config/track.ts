/**
 * The two customer-facing "tracks" 3DPIY is split into — the Shop ("dolls":
 * hobbyist, personal-use STL/3MF files) and Business (B2B: commercial
 * licenses; Serious Games is its first collection, others can join by
 * setting their `track` in src/lib/config/colors.ts). Deliberately
 * different vibes, same account system and backend. See src/proxy.ts for how the cookie gets set, and
 * src/app/[locale]/page.tsx for the chooser that starts it.
 */
export type Track = "dolls" | "business";

export const TRACK_COOKIE = "3dpiy_track";

export function isTrack(value: string | undefined): value is Track {
  return value === "dolls" || value === "business";
}

/**
 * Reads a track cookie, also accepting "serious-games" — the Business
 * track's name before 2026-10-28, still in returning visitors' cookies.
 */
export function parseTrack(value: string | undefined): Track | undefined {
  if (value === "serious-games") return "business";
  return isTrack(value) ? value : undefined;
}
