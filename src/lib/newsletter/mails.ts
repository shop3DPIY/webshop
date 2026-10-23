import "server-only";
import { sendMail } from "@/lib/mail/send";
import { emailLayout, escapeHtml } from "@/lib/mail/template";
import { manageUrl } from "./server";

const COPY = {
  nl: {
    subject: "Welkom bij de 3DPIY-nieuwsbrief",
    heading: "Je bent aangemeld!",
    body: "Leuk dat je erbij bent. Je ontvangt nieuws over nieuwe designs uit alle categorieën.",
    manage:
      "Liever alleen bepaalde categorieën, of toch geen nieuwsbrief? Via deze link pas je het aan of meld je je af:",
    link: "Voorkeuren aanpassen of afmelden",
    notYou:
      "Heb je je niet zelf aangemeld? Klik dan op de link hierboven en meld je af.",
  },
  en: {
    subject: "Welcome to the 3DPIY newsletter",
    heading: "You're signed up!",
    body: "Glad to have you. You'll hear about new designs from every category.",
    manage:
      "Prefer only certain categories, or no newsletter after all? Change it or unsubscribe here:",
    link: "Change preferences or unsubscribe",
    notYou: "Didn't sign up yourself? Use the link above to unsubscribe.",
  },
};

/** Welcome mail with the personal manage/unsubscribe link. Silently skipped without mail config. */
export async function sendWelcomeMail(
  email: string,
  token: string,
  locale: string,
) {
  const c = locale === "nl" ? COPY.nl : COPY.en;
  const url = manageUrl(token, locale);
  await sendMail({
    to: email,
    subject: c.subject,
    text: `${c.heading}\n\n${c.body}\n\n${c.manage}\n${url}\n\n${c.notYou}`,
    html: emailLayout({
      heading: c.heading,
      bodyHtml: `<p style="margin:0 0 16px">${escapeHtml(c.body)}</p>
<p style="margin:0 0 16px">${escapeHtml(c.manage)}</p>
<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#8c52ff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold">${escapeHtml(c.link)}</a></p>
<p style="margin:0;color:#6b6478;font-size:13px">${escapeHtml(c.notYou)}</p>`,
    }),
  });
}
