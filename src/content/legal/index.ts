import { EN } from "./en";
import { NL } from "./nl";

export const LEGAL_DOCS = ["privacy", "cookies", "terms", "delivery", "license"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

export const isLegalDoc = (doc: string): doc is LegalDoc =>
  (LEGAL_DOCS as readonly string[]).includes(doc);

/** The texts shown until a version is saved in Studio → Legal. */
export const DEFAULT_LEGAL: Record<LegalDoc, { en: { title: string; body: string }; nl: { title: string; body: string } }> =
  Object.fromEntries(LEGAL_DOCS.map((doc) => [doc, { en: EN[doc], nl: NL[doc] }])) as never;

/** Date the default texts were written (shown as "last updated"). */
export const DEFAULT_LEGAL_DATE = "2026-11-19";
