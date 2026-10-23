import "server-only";
import { BUSINESS_DETAILS } from "@/lib/config/business";

/**
 * Everything the site emails goes through here, via Resend
 * (https://resend.com — its REST API, no SDK needed).
 *
 * Off until RESEND_API_KEY is set (Netlify env vars + .env.local): every
 * call then returns { ok: false, reason: "not-configured" } and callers
 * fall back gracefully (the contact form opens the visitor's mail app,
 * newsletter signups are stored without a welcome mail).
 *
 * MAIL_FROM: the sender, e.g. "3DPIY <hallo@3dpiy.com>" — its domain must
 *   be verified in Resend (DNS records at TransIP).
 * MAIL_TO:   where contact-form messages go (defaults to contactEmail in
 *   src/lib/config/business.ts).
 * Replies to any site mail (welcome, newsletter) go to that same inbox,
 * since MAIL_FROM is a no-reply address with no mailbox behind it. The
 * contact form overrides this with the visitor's own address.
 */
export interface Mail {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Extra headers, e.g. List-Unsubscribe for newsletters */
  headers?: Record<string, string>;
}

export type SendResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "failed"; error?: string };

const API = "https://api.resend.com";

export const isMailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
export const contactInbox = () =>
  process.env.MAIL_TO || BUSINESS_DETAILS.contactEmail;

function toResend(mail: Mail) {
  return {
    from: process.env.MAIL_FROM,
    to: Array.isArray(mail.to) ? mail.to : [mail.to],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    reply_to: mail.replyTo ?? contactInbox(),
    ...(mail.headers && { headers: mail.headers }),
  };
}

async function post(path: string, body: unknown): Promise<SendResult> {
  if (!isMailConfigured()) return { ok: false, reason: "not-configured" };
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.text().catch(() => "");
      console.error("[mail] Resend error", res.status, error);
      return { ok: false, reason: "failed", error: `${res.status} ${error}` };
    }
    return { ok: true };
  } catch (error) {
    console.error("[mail] Resend request failed", error);
    return { ok: false, reason: "failed", error: String(error) };
  }
}

export function sendMail(mail: Mail): Promise<SendResult> {
  return post("/emails", toResend(mail));
}

/** Up to 100 separate mails in one request (each recipient gets their own). */
export function sendBatch(mails: Mail[]): Promise<SendResult> {
  return post("/emails/batch", mails.map(toResend));
}
