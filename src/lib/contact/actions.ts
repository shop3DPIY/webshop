"use server";

import { contactInbox, isMailConfigured, sendMail } from "@/lib/mail/send";
import { emailLayout, escapeHtml, textToHtml } from "@/lib/mail/template";

export type ContactResult = { status: "sent" | "invalid" | "error" | "fallback" };

/**
 * Contact form (also used for model requests / "something's not right").
 * Mails the message to the 3DPIY inbox with Reply-To set to the visitor,
 * so answering is just hitting Reply. Returns "fallback" while mail isn't
 * configured — the form then opens the visitor's own mail app instead.
 */
export async function sendContactMessage(formData: FormData): Promise<ContactResult> {
  // Honeypot: real visitors never fill this hidden field.
  if (formData.get("company")) return { status: "sent" };

  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().slice(0, 254);
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 200);
  const message = String(formData.get("message") ?? "").trim().slice(0, 5000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "invalid" };

  if (!isMailConfigured()) return { status: "fallback" };

  const result = await sendMail({
    to: contactInbox(),
    replyTo: email,
    subject: `[3DPIY contact] ${subject || "(geen onderwerp)"}`,
    text: `${message}\n\n— ${name} (${email})`,
    html: emailLayout({
      heading: subject || "Nieuw bericht",
      bodyHtml: `${textToHtml(message)}<p style="margin:0;color:#6b6478">— ${escapeHtml(name)} (<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>)</p>`,
      footerHtml: "Verstuurd via het contactformulier. Beantwoorden = direct naar de afzender.<br>",
    }),
  });
  return { status: result.ok ? "sent" : "error" };
}
