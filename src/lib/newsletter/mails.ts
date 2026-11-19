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

const CONFIRM = {
  nl: {
    subject: "Bevestig je aanmelding voor de 3DPIY-nieuwsbrief",
    heading: "Nog één klik",
    body: "Je hebt je aangemeld voor de 3DPIY-nieuwsbrief. Bevestig dat dit jouw e-mailadres is, dan zet ik je op de lijst.",
    button: "Ja, aanmelden",
    notYou:
      "Heb je je niet zelf aangemeld? Dan hoef je niets te doen: zonder bevestiging krijg je niets en wordt je adres na 30 dagen gewist.",
  },
  en: {
    subject: "Confirm your 3DPIY newsletter signup",
    heading: "One more click",
    body: "You signed up for the 3DPIY newsletter. Confirm that this is your email address and you're on the list.",
    button: "Yes, sign me up",
    notYou:
      "Didn't sign up yourself? Then do nothing: without confirmation you get no mail, and the address is erased after 30 days.",
  },
};

/** Double opt-in: the link opens the manage page, whose button confirms. */
export async function sendConfirmMail(
  email: string,
  token: string,
  locale: string,
) {
  const c = locale === "nl" ? CONFIRM.nl : CONFIRM.en;
  const url = manageUrl(token, locale);
  await sendMail({
    to: email,
    subject: c.subject,
    text: `${c.heading}\n\n${c.body}\n\n${c.button}: ${url}\n\n${c.notYou}`,
    html: emailLayout({
      heading: c.heading,
      bodyHtml: `<p style="margin:0 0 24px">${escapeHtml(c.body)}</p>
<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#8c52ff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold">${escapeHtml(c.button)}</a></p>
<p style="margin:0;color:#6b6478;font-size:13px">${escapeHtml(c.notYou)}</p>`,
    }),
  });
}
