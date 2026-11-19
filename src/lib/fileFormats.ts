/**
 * Download formats as customers see them. STL/3MF/ZIP are shown as is;
 * "PDF" is the printing instructions, "PATTERN" a sewing pattern (also a
 * PDF file, see migration 0020).
 */
const LABELS: Record<string, { en: string; nl: string }> = {
  PDF: { en: "Instructions (PDF)", nl: "Instructies (PDF)" },
  PATTERN: { en: "Sewing pattern (PDF)", nl: "Naaipatroon (PDF)" },
};

export function formatLabel(format: string, locale: string): string {
  const label = LABELS[format];
  return label ? (locale === "nl" ? label.nl : label.en) : format;
}
