"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COLLECTIONS } from "@/lib/config/colors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  confirmSubscriber,
  getSubscriberByToken,
  isEmail,
  isToken,
  upsertSubscriber,
} from "./server";
import { sendConfirmMail, sendWelcomeMail } from "./mails";
import { ensureWelcomeCode } from "./welcomeCode";

export type SignupState = { status: "idle" | "ok" | "invalid" | "error" };

/**
 * Footer signup: just an email, every category by default. Double
 * opt-in: they get a confirmation mail and only join after clicking it.
 */
export async function subscribeToNewsletter(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  // Honeypot: real visitors never fill this hidden field.
  if (formData.get("website")) return { status: "ok" };
  const email = String(formData.get("email") ?? "").trim();
  if (!isEmail(email)) return { status: "invalid" };
  const result = await upsertSubscriber({
    email,
    locale: String(formData.get("locale") ?? "en"),
    source: "footer",
  });
  if (result.sendConfirm && result.token)
    await sendConfirmMail(email, result.token, result.locale ?? "en");
  return { status: result.ok ? "ok" : "error" };
}

/**
 * Account page: subscribe the signed-in customer's own address — already
 * verified at signup, so no confirmation mail is needed.
 */
export async function subscribeFromAccount(formData: FormData) {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user?.email) return;
  const result = await upsertSubscriber({
    email: user.email,
    locale: String(formData.get("locale") ?? "en"),
    source: "account",
    userId: user.id,
    confirmed: true,
  });
  if (result.welcome && result.token) {
    const code = await ensureWelcomeCode(user.email);
    await sendWelcomeMail(user.email, result.token, result.locale ?? "en", code);
  }
  revalidatePath("/", "layout");
  const locale = String(formData.get("locale") ?? "en");
  redirect(
    `${locale === "nl" ? "/nl" : ""}/account?newsletter=subscribed#newsletter`,
  );
}

function backToManagePage(locale: string, token: string, state: string): never {
  redirect(`${locale === "nl" ? "/nl" : ""}/newsletter/${token}?s=${state}`);
}

/** Manage page (link in every mail): which categories, or all. */
export async function updateNewsletterPreferences(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  const subscriber = isToken(token) ? await getSubscriberByToken(token) : null;
  const admin = createAdminClient();
  if (!subscriber || !admin) redirect("/");

  const allCategories = formData.get("mode") !== "some";
  const categories = formData
    .getAll("categories")
    .map(String)
    .filter((slug) => slug in COLLECTIONS);
  if (!allCategories && categories.length === 0)
    backToManagePage(locale, token, "none");

  await admin
    .from("newsletter_subscribers")
    .update({
      status: "subscribed",
      unsubscribed_at: null,
      all_categories: allCategories,
      categories: allCategories ? [] : categories,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriber.id);
  backToManagePage(locale, token, "saved");
}

export async function unsubscribeFromNewsletter(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  const subscriber = isToken(token) ? await getSubscriberByToken(token) : null;
  const admin = createAdminClient();
  if (!subscriber || !admin) redirect("/");

  const now = new Date().toISOString();
  await admin
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: now, updated_at: now })
    .eq("id", subscriber.id);
  backToManagePage(locale, token, "unsubscribed");
}

export async function resubscribeToNewsletter(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  const subscriber = isToken(token) ? await getSubscriberByToken(token) : null;
  if (!subscriber) redirect("/");
  // The personal link proves the address, so no new confirmation mail.
  await upsertSubscriber({
    email: subscriber.email,
    locale,
    source: subscriber.source,
    confirmed: true,
  });
  backToManagePage(locale, token, "resubscribed");
}

/** Double opt-in: the button on the page the confirmation mail links to. */
export async function confirmNewsletter(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  const subscriber = isToken(token) ? await getSubscriberByToken(token) : null;
  if (!subscriber) redirect("/");
  if (subscriber.status === "pending" && (await confirmSubscriber(subscriber))) {
    const code = await ensureWelcomeCode(subscriber.email);
    await sendWelcomeMail(subscriber.email, subscriber.token, subscriber.locale, code);
  }
  backToManagePage(locale, token, "confirmed");
}
