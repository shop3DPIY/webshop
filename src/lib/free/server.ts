import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMailConfigured, sendMail } from "@/lib/mail/send";
import { emailLayout, escapeHtml } from "@/lib/mail/template";
import { manageUrl } from "@/lib/newsletter/server";

/**
 * Free designs are for newsletter subscribers. Leaving your email on a
 * free design's page subscribes you and records a free_downloads row
 * (migration 0015) whose token is the key to the files. The link is
 * mailed, which also proves the address is real.
 */

/** How long a mailed download link works; asking again mails a fresh one. */
export const FREE_LINK_DAYS = 30;

const siteUrl = () =>
  (process.env.SITE_URL || "https://3dpiy.com").replace(/\/$/, "");

export const freeDownloadUrl = (token: string, format: string) =>
  `${siteUrl()}/api/free/${token}/${encodeURIComponent(format)}`;

/** Creates (or renews) the address's access to a free design; returns its token. */
export async function grantFreeDownload(
  email: string,
  productId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("free_downloads")
    .upsert(
      {
        email,
        product_id: productId,
        token: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
      { onConflict: "email,product_id" },
    )
    .select("token")
    .single();
  return data?.token ?? null;
}

/** The design behind a mailed link, while the link is still valid. */
export async function productForFreeToken(token: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(token)) return null;
  const since = new Date(Date.now() - FREE_LINK_DAYS * 86_400_000).toISOString();
  const { data } = await admin
    .from("free_downloads")
    .select("product_id")
    .eq("token", token)
    .gte("created_at", since)
    .maybeSingle();
  return data?.product_id ?? null;
}

const COPY = {
  en: {
    subject: (title: string) => `Your free download: ${title}`,
    heading: "Here's your free design",
    body: (title: string) =>
      `Thanks for subscribing! Download ${title} with the button below. The link works for ${FREE_LINK_DAYS} days.`,
    download: "Download",
    news: "You're now on the 3DPIY newsletter. Change your preferences or unsubscribe any time:",
    manage: "Newsletter preferences",
  },
  nl: {
    subject: (title: string) => `Je gratis download: ${title}`,
    heading: "Hier is je gratis ontwerp",
    body: (title: string) =>
      `Bedankt voor je inschrijving! Download ${title} met de knop hieronder. De link werkt ${FREE_LINK_DAYS} dagen.`,
    download: "Downloaden",
    news: "Je staat nu op de 3DPIY-nieuwsbrief. Voorkeuren aanpassen of afmelden kan altijd:",
    manage: "Nieuwsbriefvoorkeuren",
  },
};

export async function sendFreeDownloadMail(params: {
  email: string;
  locale: string;
  title: string;
  formats: string[];
  token: string;
  newsletterToken: string;
}) {
  if (!isMailConfigured()) return { ok: false as const };
  const c = params.locale === "nl" ? COPY.nl : COPY.en;
  const manage = manageUrl(params.newsletterToken, params.locale);
  const links = params.formats.map((format) => ({
    label: params.formats.length > 1 ? `${c.download} (${format})` : c.download,
    url: freeDownloadUrl(params.token, format),
  }));

  return sendMail({
    to: params.email,
    subject: c.subject(params.title),
    text: [
      c.heading,
      c.body(params.title),
      ...links.map((l) => `${l.label}: ${l.url}`),
      `${c.news}\n${manage}`,
    ].join("\n\n"),
    html: emailLayout({
      heading: c.heading,
      bodyHtml: `<p style="margin:0 0 16px">${escapeHtml(c.body(params.title))}</p>
<p style="margin:0 0 24px">${links
        .map(
          (l) =>
            `<a href="${l.url}" style="display:inline-block;margin:0 8px 8px 0;background:#8c52ff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold">${escapeHtml(l.label)}</a>`,
        )
        .join("")}</p>`,
      footerHtml: `${escapeHtml(c.news)} <a href="${manage}" style="color:#8c52ff">${escapeHtml(c.manage)}</a><br><br>`,
    }),
  });
}
