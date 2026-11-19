/** "My materials" (calc_library, migration 0019) — shared types and maths. */

export type LibraryKind = "filament" | "extra" | "packaging" | "marketing";
export const LIBRARY_KINDS: LibraryKind[] = ["filament", "packaging", "extra", "marketing"];

export interface LibraryItem {
  id: string;
  kind: LibraryKind;
  name: string;
  supplier: string;
  /** Filament: spool price; supplies: pack price */
  price: number;
  /** Filament: spool grams; supplies: pieces per pack */
  packSize: number;
}

/** Filament €/kg from spool price and weight. */
export const pricePerKg = (item: LibraryItem) =>
  item.packSize > 0 ? Math.round((item.price / item.packSize) * 1000 * 100) / 100 : 0;

/** Supplies: € per piece. */
export const pricePerPiece = (item: LibraryItem) =>
  item.packSize > 0 ? item.price / item.packSize : 0;

/** The label in pick lists: "Bambu PLA Basic black — Bambu Lab". */
export const libraryLabel = (item: LibraryItem) =>
  item.supplier ? `${item.name} — ${item.supplier}` : item.name;

export function toLibraryItem(row: Record<string, unknown>): LibraryItem {
  return {
    id: String(row.id),
    kind: row.kind as LibraryKind,
    name: String(row.name ?? ""),
    supplier: String(row.supplier ?? ""),
    price: Number(row.price ?? 0),
    packSize: Number(row.pack_size ?? 1),
  };
}
