/**
 * The two customer-facing "tracks" 3DPIY is split into — Dolls & Mini
 * (hobbyist, personal-use STL/3MF files) and Serious Games (B2B, requires a
 * commercial resale license). Deliberately different vibes, same account
 * system and backend. See src/proxy.ts for how the cookie gets set, and
 * src/app/[locale]/page.tsx for the chooser that starts it.
 */
export type Track = "dolls" | "serious-games";

export const TRACK_COOKIE = "3dpiy_track";

export function isTrack(value: string | undefined): value is Track {
  return value === "dolls" || value === "serious-games";
}
