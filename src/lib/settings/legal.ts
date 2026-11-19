import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_LEGAL, LEGAL_DOCS, type LegalDoc } from "@/content/legal";
import { formatAddress, getBusinessDetails } from "./business";

/**
 * Legal pages (Studio → Legal, legal_documents in migration 0017). Your
 * edited version wins; otherwise the default text from src/content/legal.
 * Placeholders like {{kvk}} are filled from the business details, so
 * changing those in Settings updates every text.
 */

export { LEGAL_DOCS, type LegalDoc };

export interface LegalText {
  title: string;
  body: string;
  edited: boolean;
  updatedAt: string | null;
}

export async function getLegalSource(doc: LegalDoc) {
  const admin = createAdminClient();
  const { data } = admin
    ? await admin.from("legal_documents").select("*").eq("slug", doc).maybeSingle()
    : { data: null };
  const fallback = DEFAULT_LEGAL[doc];
  return {
    en: { title: data?.title_en ?? fallback.en.title, body: data?.body_en ?? fallback.en.body },
    nl: { title: data?.title_nl ?? fallback.nl.title, body: data?.body_nl ?? fallback.nl.body },
    edited: !!data,
    updatedAt: (data?.updated_at as string | undefined) ?? null,
  };
}

/** The text for the site, in the visitor's language, placeholders filled. */
export async function getLegalText(doc: LegalDoc, locale: string): Promise<LegalText> {
  const source = await getLegalSource(doc);
  const text = locale === "nl" ? source.nl : source.en;
  const b = await getBusinessDetails();
  const values: Record<string, string> = {
    company: b.companyName,
    owner: b.ownerName,
    // Country is stored in English; the Dutch texts say "Nederland".
    address: formatAddress(
      locale === "nl" && /netherlands/i.test(b.country) ? { ...b, country: "Nederland" } : b,
    ),
    kvk: b.kvk,
    vat: b.vatId,
    iban: b.iban,
    email: b.contactEmail,
    site: "3dpiy.com",
  };
  const fill = (s: string) =>
    s.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => values[key] ?? match);
  return {
    title: fill(text.title),
    body: fill(text.body),
    edited: source.edited,
    updatedAt: source.updatedAt,
  };
}
