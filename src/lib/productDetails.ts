import type { Product } from "@/types/product";

/**
 * "What's involved" and difficulty on the product page. Carmen can set
 * both in Studio; until she does, sensible defaults are derived from the
 * product (pattern or print, extra parts, electronics, supports, parts).
 */

export const INVOLVES = ["print", "sew", "parts", "electronics", "paint"] as const;
export type Involves = (typeof INVOLVES)[number];

/** Printers Carmen owns and tests on (Studio checkboxes). */
export const TEST_PRINTERS = ["Bambu Lab A1", "Bambu Lab X1 Carbon"];

/** Build volume of the A1 mini — designs this small also fit there. */
export const SMALL_BED_MM = 180;

export function involvesFor(product: Pick<Product, "productKind" | "printSettings" | "category">): Involves[] {
  const stored = product.printSettings?.involves;
  if (stored?.length) return stored;
  const list: Involves[] = [];
  if (product.productKind === "pattern") list.push("sew");
  else list.push("print");
  if (product.printSettings?.requiredParts?.length) list.push("parts");
  if (product.category === "tech-electronics") list.push("electronics");
  return list;
}

export function difficultyFor(product: Pick<Product, "productKind" | "printSettings" | "category">): number {
  const ps = product.printSettings;
  if (ps?.difficulty) return ps.difficulty;
  if (product.productKind === "pattern") return 2;
  const involves = involvesFor(product);
  let level = 1;
  if ((ps?.parts ?? 1) > 3) level++;
  if (ps?.supportsRequired) level++;
  if (involves.includes("parts") || involves.includes("paint")) level++;
  if (involves.includes("electronics")) level++;
  return Math.min(5, level);
}

export const fitsSmallBed = (d?: { width: number; depth: number; height: number }) =>
  !!d && d.width > 0 && Math.max(d.width, d.depth, d.height) <= SMALL_BED_MM;
