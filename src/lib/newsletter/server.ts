import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Subscriber {
  id: string;
  email: string;
  token: string;
  status: "pending" | "subscribed" | "unsubscribed";
  all_categories: boolean;
  categories: string[];
  locale: string;
  source: "footer" | "account" | "free_download";
  created_at: string;
  confirm_sent_at: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isToken = (value: string) => UUID_RE.test(value);

/** Loose but practical email check; the real proof is the mail arriving. */
export const isEmail = (value: string) =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * The personal manage link that goes at the bottom of every newsletter.
 * SITE_URL lets local testing (.env.local: http://localhost:3000) send
 * links that open the local site; production defaults to 3dpiy.com.
 */
export const manageUrl = (token: string, locale: string) =>
  `${(process.env.SITE_URL || "https://3dpiy.com").replace(/\/$/, "")}${locale === "nl" ? "/nl" : ""}/newsletter/${token}`;

export async function getSubscriberByToken(
  token: string,
): Promise<Subscriber | null> {
  if (!isToken(token)) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("newsletter_subscribers")
    .select(
      "id, email, token, status, all_categories, categories, locale, source, created_at, confirm_sent_at",
    )
    .eq("token", token)
    .maybeSingle();
  return (data as Subscriber | null) ?? null;
}

export async function getSubscriberByEmail(
  email: string,
): Promise<Subscriber | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("newsletter_subscribers")
    .select(
      "id, email, token, status, all_categories, categories, locale, source, created_at, confirm_sent_at",
    )
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return (data as Subscriber | null) ?? null;
}

/** Unconfirmed signups are forgotten after this many days. */
const PENDING_DAYS = 30;
/** A repeat signup re-sends the confirmation mail at most this often. */
const RESEND_CONFIRM_MS = 10 * 60 * 1000;

/**
 * Subscribe (or re-subscribe) an address — with double opt-in.
 *
 * `confirmed` is true when the address is already proven to be theirs:
 * a signed-in account (verified email) or the personal link from a mail.
 * Otherwise (footer, free-download checkbox) the address becomes
 * 'pending' and only joins after the link in the confirmation mail
 * (confirmSubscriber). An address that's already subscribed stays so
 * and keeps its category choices.
 *
 * Returns:
 * - welcome: became subscribed just now → send the welcome mail;
 * - pending: waits for confirmation;
 * - sendConfirm: pending and a confirmation mail is due (not one sent
 *   in the last few minutes) — the caller sends it.
 */
export async function upsertSubscriber(params: {
  email: string;
  locale: string;
  source: "footer" | "account" | "free_download";
  userId?: string;
  confirmed?: boolean;
}): Promise<{
  ok: boolean;
  token?: string;
  locale?: string;
  welcome?: boolean;
  pending?: boolean;
  sendConfirm?: boolean;
}> {
  const admin = createAdminClient();
  if (!admin) return { ok: false };
  const email = params.email.trim().toLowerCase();
  const now = new Date().toISOString();

  // Privacy: never keep unconfirmed addresses around for long.
  await admin
    .from("newsletter_subscribers")
    .delete()
    .eq("status", "pending")
    .lt("created_at", new Date(Date.now() - PENDING_DAYS * 86_400_000).toISOString());

  const existing = await getSubscriberByEmail(email);

  if (existing?.status === "subscribed") {
    if (params.userId) {
      await admin
        .from("newsletter_subscribers")
        .update({ user_id: params.userId, updated_at: now })
        .eq("id", existing.id);
    }
    return { ok: true, token: existing.token, locale: existing.locale };
  }

  if (params.confirmed) {
    const values = {
      status: "subscribed",
      unsubscribed_at: null,
      consent_at: now,
      confirmed_at: now,
      ...(params.userId && { user_id: params.userId }),
      updated_at: now,
    };
    if (existing) {
      const { error } = await admin
        .from("newsletter_subscribers")
        .update(values)
        .eq("id", existing.id);
      return { ok: !error, token: existing.token, locale: existing.locale, welcome: !error };
    }
    const locale = params.locale === "nl" ? "nl" : "en";
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .insert({ email, locale, source: params.source, ...values })
      .select("token")
      .single();
    return { ok: !error, token: data?.token, locale, welcome: !error };
  }

  // Not proven yet: pending until the confirmation link is clicked.
  if (existing) {
    const due =
      !existing.confirm_sent_at ||
      Date.now() - new Date(existing.confirm_sent_at).getTime() > RESEND_CONFIRM_MS;
    const { error } = await admin
      .from("newsletter_subscribers")
      .update({
        status: "pending",
        ...(due && { confirm_sent_at: now }),
        ...(params.userId && { user_id: params.userId }),
        updated_at: now,
      })
      .eq("id", existing.id);
    return {
      ok: !error,
      token: existing.token,
      locale: existing.locale,
      pending: true,
      sendConfirm: !error && due,
    };
  }

  const locale = params.locale === "nl" ? "nl" : "en";
  const { data, error } = await admin
    .from("newsletter_subscribers")
    .insert({
      email,
      locale,
      source: params.source,
      status: "pending",
      confirm_sent_at: now,
      user_id: params.userId ?? null,
    })
    .select("token")
    .single();
  return { ok: !error, token: data?.token, locale, pending: true, sendConfirm: !error };
}

/** The confirmation link's button: pending → subscribed. */
export async function confirmSubscriber(subscriber: Subscriber): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin || subscriber.status !== "pending") return false;
  const now = new Date().toISOString();
  const { error } = await admin
    .from("newsletter_subscribers")
    .update({
      status: "subscribed",
      unsubscribed_at: null,
      consent_at: now,
      confirmed_at: now,
      updated_at: now,
    })
    .eq("id", subscriber.id);
  return !error;
}
