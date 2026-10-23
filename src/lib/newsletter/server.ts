import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface Subscriber {
  id: string;
  email: string;
  token: string;
  status: "subscribed" | "unsubscribed";
  all_categories: boolean;
  categories: string[];
  locale: string;
  source: "footer" | "account";
  created_at: string;
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
      "id, email, token, status, all_categories, categories, locale, source, created_at",
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
      "id, email, token, status, all_categories, categories, locale, source, created_at",
    )
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return (data as Subscriber | null) ?? null;
}

/**
 * Subscribe (or re-subscribe) an address. An address that's already on the
 * list keeps its category choices; one that had unsubscribed comes back.
 * `welcome` is true when this is a new (or returning) subscriber — the
 * caller sends the welcome mail then, not on a repeat signup.
 */
export async function upsertSubscriber(params: {
  email: string;
  locale: string;
  source: "footer" | "account";
  userId?: string;
}): Promise<{
  ok: boolean;
  token?: string;
  locale?: string;
  welcome?: boolean;
}> {
  const admin = createAdminClient();
  if (!admin) return { ok: false };
  const email = params.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const existing = await getSubscriberByEmail(email);

  if (existing) {
    const { error } = await admin
      .from("newsletter_subscribers")
      .update({
        status: "subscribed",
        unsubscribed_at: null,
        ...(existing.status === "unsubscribed" && { consent_at: now }),
        ...(params.userId && { user_id: params.userId }),
        updated_at: now,
      })
      .eq("id", existing.id);
    return {
      ok: !error,
      token: existing.token,
      locale: existing.locale,
      welcome: existing.status === "unsubscribed",
    };
  }

  const locale = params.locale === "nl" ? "nl" : "en";
  const { data, error } = await admin
    .from("newsletter_subscribers")
    .insert({
      email,
      locale,
      source: params.source,
      user_id: params.userId ?? null,
    })
    .select("token")
    .single();
  return { ok: !error, token: data?.token, locale, welcome: !error };
}
