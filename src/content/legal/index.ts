import { EN } from "./en";
import { NL } from "./nl";
import { FAQ_EN } from "../faq/en";
import { FAQ_NL } from "../faq/nl";

/**
 * Site texts editable in Studio → Texts: the five legal pages and the two
 * FAQs. The defaults live in code; a saved version (legal_documents)
 * wins.
 */
export const LEGAL_DOCS = ["privacy", "cookies", "terms", "delivery", "license"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];
export const FAQ_DOCS = ["faq-shop", "faq-business"] as const;
export type FaqDoc = (typeof FAQ_DOCS)[number];
export const TEXT_DOCS = [...LEGAL_DOCS, ...FAQ_DOCS] as const;
export type TextDoc = LegalDoc | FaqDoc;

export const isLegalDoc = (doc: string): doc is LegalDoc =>
  (LEGAL_DOCS as readonly string[]).includes(doc);
export const isTextDoc = (doc: string): doc is TextDoc =>
  (TEXT_DOCS as readonly string[]).includes(doc);

type Text = { title: string; body: string };

/** The texts shown until a version is saved in Studio. */
export const DEFAULT_LEGAL: Record<TextDoc, { en: Text; nl: Text }> = {
  ...(Object.fromEntries(LEGAL_DOCS.map((doc) => [doc, { en: EN[doc], nl: NL[doc] }])) as Record<LegalDoc, { en: Text; nl: Text }>),
  ...(Object.fromEntries(FAQ_DOCS.map((doc) => [doc, { en: FAQ_EN[doc], nl: FAQ_NL[doc] }])) as Record<FaqDoc, { en: Text; nl: Text }>),
};

/** Date the default texts were written (shown as "last updated"). */
export const DEFAULT_LEGAL_DATE = "2026-11-19";

/** A FAQ text → question/answer pairs: every "## " line starts a question. */
export function faqItems(body: string): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = [];
  for (const block of body.replace(/\r\n/g, "\n").split(/^## /m).slice(1)) {
    const [q, ...rest] = block.split("\n");
    const a = rest.join("\n").trim();
    if (q.trim() && a) items.push({ q: q.trim(), a });
  }
  return items;
}
