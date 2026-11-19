import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUSINESS_DETAILS } from "@/lib/config/business";

/**
 * Business details, edited in Studio → Settings (site_settings, migration
 * 0017). Falls back to src/lib/config/business.ts for anything not filled
 * in yet. Read on the server only — the IBAN never reaches the browser
 * unless a legal text uses {{iban}}.
 */

export interface BusinessDetails {
  companyName: string;
  ownerName: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
  kvk: string;
  vatId: string;
  iban: string;
  contactEmail: string;
}

export const BUSINESS_FIELDS: (keyof BusinessDetails)[] = [
  "companyName",
  "ownerName",
  "street",
  "postcode",
  "city",
  "country",
  "kvk",
  "vatId",
  "iban",
  "contactEmail",
];

const DEFAULTS: BusinessDetails = {
  companyName: "3DPIY",
  ownerName: "",
  street: "",
  postcode: "",
  city: "",
  country: "the Netherlands",
  kvk: BUSINESS_DETAILS.kvk,
  vatId: BUSINESS_DETAILS.vatId,
  iban: "",
  contactEmail: BUSINESS_DETAILS.contactEmail,
};

export const getBusinessDetails = cache(async (): Promise<BusinessDetails> => {
  const admin = createAdminClient();
  if (!admin) return DEFAULTS;
  const { data } = await admin
    .from("site_settings")
    .select("business")
    .eq("id", 1)
    .maybeSingle();
  const stored = (data?.business ?? {}) as Partial<BusinessDetails>;
  const merged = { ...DEFAULTS };
  for (const key of BUSINESS_FIELDS) {
    const value = stored[key];
    if (typeof value === "string" && value.trim()) merged[key] = value.trim();
  }
  return merged;
});

/** One line for texts and the footer, e.g. "Street 1, 1234 AB City, the Netherlands". */
export function formatAddress(b: BusinessDetails): string {
  return [b.street, [b.postcode, b.city].filter(Boolean).join(" "), b.country]
    .filter(Boolean)
    .join(", ");
}
