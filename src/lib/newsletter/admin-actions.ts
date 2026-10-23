"use server";

import { redirect } from "next/navigation";
import { COLLECTIONS } from "@/lib/config/colors";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/studio/guard";
import {
  isMailConfigured,
  sendBatch,
  sendMail,
  type Mail,
} from "@/lib/mail/send";
import { emailLayout, textToHtml } from "@/lib/mail/template";
import { manageUrl } from "./server";

/** Resend accepts at most 100 mails per batch request. */
const BATCH_SIZE = 100;

function newsletterMail(params: {
  to: string;
  subject: string;
  message: string;
  manageLink: string;
}): Mail {
  const { to, subject, message, manageLink } = params;
  const footer = `<a href="${manageLink}" style="color:#8c52ff">Voorkeuren aanpassen of afmelden</a> · <a href="${manageLink}" style="color:#8c52ff">Change preferences or unsubscribe</a><br><br>`;
  return {
    to,
    subject,
    text: `${message}\n\n—\nVoorkeuren aanpassen of afmelden / Change preferences or unsubscribe:\n${manageLink}`,
    html: emailLayout({
      heading: subject,
      bodyHtml: textToHtml(message),
      footerHtml: footer,
    }),
    headers: { "List-Unsubscribe": `<${manageLink}>` },
  };
}

/**
 * Studio → Newsletter → Send. "test" mails only the signed-in admin;
 * "send" mails every subscriber in the chosen categories (or everyone),
 * each with their own manage/unsubscribe link.
 */
export async function sendNewsletter(formData: FormData) {
  const { profile, user } = await requireAdmin();
  const back = (query: string) => redirect(`/studio/newsletter/send?${query}`);

  if (!isMailConfigured()) back("error=not-configured");
  const subject = String(formData.get("subject") ?? "")
    .trim()
    .slice(0, 200);
  const message = String(formData.get("message") ?? "").trim();
  if (!subject || !message) back("error=empty");

  const audience = formData.get("audience") === "some" ? "some" : "all";
  const categories = formData
    .getAll("categories")
    .map(String)
    .filter((slug) => slug in COLLECTIONS);
  if (audience === "some" && categories.length === 0)
    back("error=no-categories");

  if (formData.get("intent") === "test") {
    const to = profile?.email ?? user.email!;
    const result = await sendMail(
      newsletterMail({
        to,
        subject,
        message,
        manageLink: "https://3dpiy.com/newsletter/test-link",
      }),
    );
    back(result.ok ? "test=1" : "error=failed");
  }

  if (formData.get("confirm") !== "on") back("error=confirm");

  const admin = createAdminClient();
  if (!admin) back("error=failed");
  const { data } = await admin!
    .from("newsletter_subscribers")
    .select("email, token, locale, all_categories, categories")
    .eq("status", "subscribed");
  const recipients = (data ?? []).filter(
    (r) =>
      audience === "all" ||
      r.all_categories ||
      (r.categories as string[]).some((slug) => categories.includes(slug)),
  );
  if (recipients.length === 0) back("error=no-recipients");

  let sent = 0;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients
      .slice(i, i + BATCH_SIZE)
      .map((r) =>
        newsletterMail({
          to: r.email,
          subject,
          message,
          manageLink: manageUrl(r.token, r.locale),
        }),
      );
    const result = await sendBatch(chunk);
    if (!result.ok) back(`error=failed&sent=${sent}`);
    sent += chunk.length;
  }
  back(`sent=${sent}`);
}
