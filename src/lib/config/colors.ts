/**
 * Central color configuration for 3DPIY.
 *
 * Every collection has one accent color used consistently across badges,
 * buttons, category pages and product cards. Update colors here only —
 * never hardcode hex values in components or content files.
 *
 * These values are mirrored as CSS custom properties in `src/app/globals.css`
 * (`@theme` block) so Tailwind utility classes such as `bg-doll-mini` or
 * `text-ikea-hacks` are generated automatically. Keep both files in sync.
 */

export type CollectionSlug =
  | "doll-mini"
  | "home-living"
  | "ikea-hacks"
  | "organize"
  | "tech-electronics"
  | "other"
  | "serious-games";

export interface CollectionTheme {
  slug: CollectionSlug;
  name: string;
  tagline: string;
  /** Primary accent color (hex) */
  color: string;
  /** Light tint of the accent, for soft backgrounds/badges */
  colorSoft: string;
  /** Which text color reads best on top of `color` */
  textOn: "light" | "dark";
  /**
   * false hides this collection from homepage/shop browsing grids while
   * keeping it fully defined — existing products keep their category,
   * their collection page still exists, and Studio's product form still
   * offers it. Defaults to true when omitted.
   */
  enabled?: boolean;
  /**
   * Which customer-facing track (see src/lib/track.ts) this collection
   * belongs to. undefined = not assigned to a track yet (stays out of
   * both /dolls and /serious-games browsing until it's enabled and
   * assigned).
   */
  track?: "dolls" | "serious-games";
}

export const BRAND_COLORS = {
  /** Primary text / ink color, used instead of pure black */
  ink: "#14121A",
  /** Primary background */
  paper: "#FFFFFF",
  /** Soft alternate section background */
  mist: "#F6F4FA",
  /** Hairline border color */
  line: "#E7E3F0",
  /**
   * Signature brand accent — reserved for logo, focus rings, nav highlights,
   * and primary buttons (white text on this needs to clear 4.5:1 contrast).
   */
  accent: "#0B7F86",
} as const;

export const COLLECTIONS: Record<CollectionSlug, CollectionTheme> = {
  "doll-mini": {
    slug: "doll-mini",
    name: "Doll & Mini",
    tagline: "1:6 doll furniture and 1:12 dollhouse miniatures",
    color: "#FF4FA0",
    colorSoft: "#FFE3F2",
    textOn: "dark",
    track: "dolls",
  },
  "home-living": {
    slug: "home-living",
    name: "Home & Living",
    tagline: "Home decor and lighting designs",
    color: "#FF7A3D",
    colorSoft: "#FFE8DA",
    textOn: "dark",
    enabled: true,
    track: "dolls",
  },
  "ikea-hacks": {
    slug: "ikea-hacks",
    name: "IKEA Hacks",
    tagline: "Smart accessories for IKEA furniture",
    color: "#FFC93D",
    colorSoft: "#FFF3D6",
    textOn: "dark",
    enabled: true,
    track: "dolls",
  },
  organize: {
    slug: "organize",
    name: "Organize",
    tagline: "Smart storage and organization solutions",
    color: "#2FBF71",
    colorSoft: "#DFF6E8",
    textOn: "dark",
    enabled: true,
    track: "dolls",
  },
  "tech-electronics": {
    slug: "tech-electronics",
    name: "Tech & Electronics",
    tagline: "Enclosures and DIY electronics projects",
    color: "#2F8EFF",
    colorSoft: "#DCEAFF",
    textOn: "dark",
    enabled: true,
    track: "dolls",
  },
  other: {
    slug: "other",
    name: "Other",
    tagline: "Anything that doesn't fit the other collections yet",
    color: "#6B7280",
    colorSoft: "#E8E9EC",
    textOn: "dark",
    enabled: true,
    track: "dolls",
  },
  "serious-games": {
    slug: "serious-games",
    name: "Serious Games",
    tagline: "Educational and professional serious-game designs",
    color: "#8C52FF",
    colorSoft: "#EAE1FC",
    textOn: "dark",
    track: "serious-games",
  },
};

export const COLLECTION_LIST: CollectionTheme[] = Object.values(COLLECTIONS);

/** Collections shown in homepage/shop browsing grids — see `enabled` above. */
export const ACTIVE_COLLECTION_LIST: CollectionTheme[] = COLLECTION_LIST.filter(
  (c) => c.enabled !== false,
);

/** Active collections belonging to one track — see src/lib/config/track.ts. */
export function getTrackCollections(track: "dolls" | "serious-games"): CollectionTheme[] {
  return ACTIVE_COLLECTION_LIST.filter((c) => c.track === track);
}

export function getCollection(slug: CollectionSlug): CollectionTheme {
  return COLLECTIONS[slug];
}

/**
 * Static Tailwind class names per collection. Written out literally (not
 * built from template strings) so Tailwind's scanner can always find them,
 * even though the active collection is only known at runtime.
 * Must stay in sync with the `@theme` tokens in globals.css.
 */
export const COLLECTION_CLASSNAMES: Record<
  CollectionSlug,
  {
    bg: string;
    bgSoft: string;
    text: string;
    border: string;
    /** 15%-tint translucent fill, for the glassmorphism tile treatment (see CollectionCard). */
    wash: string;
    /** 45%-tint translucent fill, the tile's hover state. */
    washHover: string;
  }
> = {
  "doll-mini": {
    bg: "bg-doll-mini",
    bgSoft: "bg-doll-mini-soft",
    text: "text-doll-mini",
    border: "border-doll-mini",
    wash: "bg-doll-mini-wash",
    washHover: "hover:bg-doll-mini-wash-hover",
  },
  "home-living": {
    bg: "bg-home-living",
    bgSoft: "bg-home-living-soft",
    text: "text-home-living",
    border: "border-home-living",
    wash: "bg-home-living-wash",
    washHover: "hover:bg-home-living-wash-hover",
  },
  "ikea-hacks": {
    bg: "bg-ikea-hacks",
    bgSoft: "bg-ikea-hacks-soft",
    text: "text-ikea-hacks",
    border: "border-ikea-hacks",
    wash: "bg-ikea-hacks-wash",
    washHover: "hover:bg-ikea-hacks-wash-hover",
  },
  organize: {
    bg: "bg-organize",
    bgSoft: "bg-organize-soft",
    text: "text-organize",
    border: "border-organize",
    wash: "bg-organize-wash",
    washHover: "hover:bg-organize-wash-hover",
  },
  "tech-electronics": {
    bg: "bg-tech-electronics",
    bgSoft: "bg-tech-electronics-soft",
    text: "text-tech-electronics",
    border: "border-tech-electronics",
    wash: "bg-tech-electronics-wash",
    washHover: "hover:bg-tech-electronics-wash-hover",
  },
  other: {
    bg: "bg-other",
    bgSoft: "bg-other-soft",
    text: "text-other",
    border: "border-other",
    wash: "bg-other-wash",
    washHover: "hover:bg-other-wash-hover",
  },
  "serious-games": {
    bg: "bg-serious-games",
    bgSoft: "bg-serious-games-soft",
    text: "text-serious-games",
    border: "border-serious-games",
    wash: "bg-serious-games-wash",
    washHover: "hover:bg-serious-games-wash-hover",
  },
};
