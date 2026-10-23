/**
 * Company registration details, shown in the footer on every page.
 * Placeholders until 3DPIY is registered — fill in the real numbers here
 * (and nowhere else) once the KvK registration is done. Use the btw-id
 * (NL…B01, the one meant for invoices and websites), not the
 * omzetbelastingnummer that contains your BSN.
 */
export const BUSINESS_DETAILS = {
  kvk: "xxxxxxxx",
  vatId: "NLxxxxxxxxxB01",
  /**
   * Where the contact form sends to and the address shown on the contact
   * page. Temporarily the Outlook address — switch to an @3dpiy.com
   * address once that mailbox exists.
   */
  contactEmail: "shop3dpiy@outlook.com",
} as const;
