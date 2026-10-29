import type { CompatibleLink } from "@/types/product";

/**
 * "Compatible with" links (stored in products.external_links.compatible).
 *
 * In Studio they're typed one per line as "Label | https://…" (the URL is
 * optional). For IKEA hacks the ingest route fills them in itself from the
 * folder name and file names: Carmen always puts the IKEA product name in
 * there (e.g. "Trofast_kallax_slider"), and every IKEA name found becomes
 * a link to IKEA's own search for it — that never goes stale the way a
 * direct article link does when IKEA renumbers a product.
 */

export function parseCompatible(text: string): CompatibleLink[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((part) => part.trim());
      return url && /^https?:\/\//i.test(url) ? { label, url } : { label };
    })
    .filter((link) => link.label)
    .slice(0, 10);
}

export const formatCompatible = (links: CompatibleLink[] | undefined) =>
  (links ?? []).map((l) => (l.url ? `${l.label} | ${l.url}` : l.label)).join("\n");

/** IKEA product (series) names that 3DPIY designs commonly fit. */
const IKEA_NAMES = [
  "ALEX", "ALGOT", "APTITLIG", "BEKANT", "BESTA", "BESTÅ", "BILLY", "BOAXEL",
  "BRIMNES", "BROR", "BYGEL", "DRÖNA", "DRONA", "EKET", "EKBY", "ENHET",
  "FINTORP", "FJÄLLBO", "GNEDBY", "GRUNDTAL", "HAUGA", "HEMNES", "HYLLIS",
  "IDÅSEN", "IDASEN", "IVAR", "JONAXEL", "KALLAX", "KNAGGLIG", "KNOXHULT",
  "KUGGIS", "KULLEN", "KUNGSFORS", "LACK", "LAGKAPTEN", "LERBERG", "LINNMON",
  "MALM", "METOD", "MICKE", "MITTZON", "MOPPE", "NORDLI", "OMAR", "PAX",
  "PLATSA", "RÅSKOG", "RASKOG", "SAMLA", "SEKTION", "SKÅDIS", "SKADIS",
  "SKUBB", "SMÅSTAD", "SMASTAD", "SONGESAND", "STUVA", "TARVA", "TJENA",
  "TROFAST", "UPPSPEL", "VARIERA", "VITTSJÖ", "VITTSJO",
];

/** Unaccented key, so "Skadis" and "SKÅDIS" count as one product. */
const plain = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

export function ikeaCompatibleFrom(...texts: string[]): CompatibleLink[] {
  const words = new Set(
    texts.join(" ").split(/[^A-Za-zÀ-ÿ]+/).filter(Boolean).map(plain),
  );
  const seen = new Set<string>();
  const links: CompatibleLink[] = [];
  for (const name of IKEA_NAMES) {
    const key = plain(name);
    if (!words.has(key) || seen.has(key)) continue;
    seen.add(key);
    // Prefer the spelling with Swedish letters for the label.
    const label = IKEA_NAMES.find((n) => plain(n) === key && n !== key) ?? name;
    links.push({
      label: `IKEA ${label}`,
      url: `https://www.ikea.com/nl/nl/search/?q=${encodeURIComponent(key.toLowerCase())}`,
    });
  }
  return links;
}
