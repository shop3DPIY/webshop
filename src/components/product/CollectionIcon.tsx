import type { CollectionSlug } from "@/lib/config/colors";

/** A simple line icon per collection (24×24, currentColor). */
const PATHS: Record<CollectionSlug, string[]> = {
  // chair
  "doll-mini": ["M7 3v9", "M17 3v9", "M7 7h10", "M5 12h14v3H5z", "M6 15v6", "M18 15v6"],
  // house
  "home-living": ["M3 11 12 4l9 7", "M5 10v10h14V10", "M10 20v-6h4v6"],
  // star
  "ikea-hacks": ["M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"],
  // box
  organize: ["M3 7l9-4 9 4-9 4z", "M3 7v10l9 4 9-4V7", "M12 11v10"],
  // chip
  "tech-electronics": ["M7 7h10v10H7z", "M10 10h4v4h-4z", "M9 3v4", "M15 3v4", "M9 17v4", "M15 17v4", "M3 9h4", "M3 15h4", "M17 9h4", "M17 15h4"],
  // die
  games: ["M4 4h16v16H4z", "M8.5 8.5h.01", "M15.5 8.5h.01", "M12 12h.01", "M8.5 15.5h.01", "M15.5 15.5h.01"],
  // pencil
  kids: ["M4 20l1.2-4.4L15.8 5a2.1 2.1 0 0 1 3 3L8.4 18.6z", "M13.8 7l3 3", "M4 20h4.4"],
  // sparkles
  other: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "M6 6l2.5 2.5", "M15.5 15.5 18 18", "M18 6l-2.5 2.5", "M8.5 15.5 6 18"],
  // puzzle piece
  "serious-games": ["M4 8h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4v-4a2 2 0 1 0 0-4z"],
};

export function CollectionIcon({ slug, className = "" }: { slug: CollectionSlug; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {(PATHS[slug] ?? PATHS.other).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
