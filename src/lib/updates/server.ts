import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMailConfigured, sendBatch, type Mail } from "@/lib/mail/send";
import { emailLayout, escapeHtml, textToHtml } from "@/lib/mail/template";

/**
 * "A new version of your design is available" mails.
 *
 * Who gets one: everyone who owns the design — account holders through
 * their entitlement, and guest buyers through the email on their order
 * (they get the purchase in their library as soon as they sign up with
 * that address, see claim_orders_for_new_profile) — plus everyone who
 * got a free design by email (free_downloads, src/lib/free).
 *
 * Buyers can opt out with the link in each mail (update_mail_optouts,
 * migration 0014). That link carries an HMAC of the address instead of a
 * stored token, keyed on the service-role key (never leaves the server).
 */

const siteUrl = () =>
  (process.env.SITE_URL || "https://3dpiy.com").replace(/\/$/, "");

function signEmail(email: string): string {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    .update(`update-mail-optout:${email}`)
    .digest("hex")
    .slice(0, 32);
}

export function isValidOptOut(email: string, signature: string): boolean {
  const expected = Buffer.from(signEmail(email));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const optOutUrl = (email: string, locale: string) =>
  `${siteUrl()}${locale === "nl" ? "/nl" : ""}/updates/unsubscribe?e=${encodeURIComponent(email)}&s=${signEmail(email)}`;

export interface UpdateRecipient {
  email: string;
  locale: "en" | "nl";
}

/** Owners of a design who haven't opted out, one entry per address. */
export async function getUpdateRecipients(
  productId: string,
): Promise<UpdateRecipient[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const [{ data: entitled }, { data: ordered }, { data: free }, { data: optouts }] =
    await Promise.all([
      admin
        .from("entitlements")
        .select("profiles(email)")
        .eq("product_id", productId),
      admin
        .from("order_items")
        .select("orders(buyer_email)")
        .eq("product_id", productId),
      admin.from("free_downloads").select("email").eq("product_id", productId),
      admin.from("update_mail_optouts").select("email"),
    ]);

  const skip = new Set((optouts ?? []).map((o) => o.email as string));
  const emails = new Set<string>();
  const add = (email: unknown) => {
    if (typeof email !== "string" || !email) return;
    const e = email.toLowerCase();
    if (!skip.has(e)) emails.add(e);
  };
  // Supabase types a to-one join as object or array depending on the
  // schema it can see; accept both.
  const first = (v: unknown) => (Array.isArray(v) ? v[0] : v) as
    | Record<string, unknown>
    | undefined;
  for (const row of entitled ?? []) add(first(row.profiles)?.email);
  for (const row of ordered ?? []) add(first(row.orders)?.buyer_email);
  for (const row of free ?? []) add(row.email);
  if (emails.size === 0) return [];

  // Language: the newsletter remembers which site language someone used.
  const { data: subs } = await admin
    .from("newsletter_subscribers")
    .select("email, locale")
    .in("email", [...emails]);
  const dutch = new Set(
    (subs ?? []).filter((s) => s.locale === "nl").map((s) => s.email),
  );

  return [...emails].map((email) => ({
    email,
    locale: dutch.has(email) ? "nl" : "en",
  }));
}

const COPY = {
  en: {
    subject: (title: string) => `Update available: ${title}`,
    heading: "A new version is ready",
    body: (title: string, version: string) =>
      `There's a new version (v${version}) of ${title}, a design you own. It's free for you — download it from your library.`,
    guest:
      "No account yet? Sign up with this email address and your purchase is there automatically.",
    button: "Go to my library",
    note: "What's new:",
    optOut: "Don't want update mails?",
    optOutLink: "Unsubscribe from update mails",
  },
  nl: {
    subject: (title: string) => `Update beschikbaar: ${title}`,
    heading: "Er is een nieuwe versie",
    body: (title: string, version: string) =>
      `Er is een nieuwe versie (v${version}) van ${title}, een ontwerp dat je hebt gekocht. Gratis voor jou — download hem in je bibliotheek.`,
    guest:
      "Nog geen account? Maak er een aan met dit e-mailadres, dan staat je aankoop er meteen in.",
    button: "Naar mijn bibliotheek",
    note: "Wat is er nieuw:",
    optOut: "Geen updatemails meer ontvangen?",
    optOutLink: "Afmelden voor updatemails",
  },
};

function updateMail(
  to: UpdateRecipient,
  product: { title: string; title_nl: string | null; version: string },
  note: string,
): Mail {
  const c = COPY[to.locale];
  const title = (to.locale === "nl" && product.title_nl) || product.title;
  const library = `${siteUrl()}${to.locale === "nl" ? "/nl" : ""}/account`;
  const optOut = optOutUrl(to.email, to.locale);
  const body = c.body(title, product.version);

  return {
    to: to.email,
    subject: c.subject(title),
    headers: {
      "List-Unsubscribe": `<${optOut}>`,
    },
    text: [
      c.heading,
      body,
      note && `${c.note}\n${note}`,
      `${c.button}: ${library}`,
      c.guest,
      `${c.optOut} ${optOut}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    html: emailLayout({
      heading: c.heading,
      bodyHtml: `<p style="margin:0 0 16px">${escapeHtml(body)}</p>
${note ? `<p style="margin:0 0 8px;font-weight:bold">${escapeHtml(c.note)}</p>${textToHtml(note)}` : ""}
<p style="margin:0 0 24px"><a href="${library}" style="display:inline-block;background:#8c52ff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold">${escapeHtml(c.button)}</a></p>
<p style="margin:0;color:#6b6478;font-size:13px">${escapeHtml(c.guest)}</p>`,
      footerHtml: `${escapeHtml(c.optOut)} <a href="${optOut}" style="color:#8c52ff">${escapeHtml(c.optOutLink)}</a><br><br>`,
    }),
  };
}

export type NotifyResult =
  | { ok: true; sent: number }
  | { ok: false; error: string };

/**
 * Mails every owner about the product's current version and records that
 * version as notified. Sends in batches of 100 (Resend's batch limit).
 */
export async function sendUpdateMails(
  productId: string,
  note: string,
): Promise<NotifyResult> {
  if (!isMailConfigured()) return { ok: false, error: "Mail is not set up" };
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Supabase is not configured" };

  const { data: product } = await admin
    .from("products")
    .select("title, title_nl, version")
    .eq("id", productId)
    .single();
  if (!product) return { ok: false, error: "Product not found" };

  const recipients = await getUpdateRecipients(productId);
  const mails = recipients.map((r) => updateMail(r, product, note.trim()));

  let sent = 0;
  for (let i = 0; i < mails.length; i += 100) {
    const result = await sendBatch(mails.slice(i, i + 100));
    if (!result.ok) {
      return {
        ok: false,
        error: `Sent ${sent} of ${mails.length}, then failed: ${result.error ?? result.reason}`,
      };
    }
    sent += Math.min(100, mails.length - i);
  }

  await admin
    .from("products")
    .update({ update_notified_version: product.version })
    .eq("id", productId);
  return { ok: true, sent };
}
