import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMailConfigured, sendMail } from "@/lib/mail/send";
import { emailButton, emailLayout, escapeHtml } from "@/lib/mail/template";
import { tierNames, type PriceTier } from "@/lib/pricing/calculate";

/**
 * Our own order confirmation, besides Polar's receipt. The law requires
 * the buyer's consent to immediate delivery — and that they lose the
 * 14-day withdrawal right — to be confirmed on a durable medium (an
 * email); this mail does that, and points to the library.
 */

const siteUrl = () => (process.env.SITE_URL || "https://3dpiy.com").replace(/\/$/, "");

const COPY = {
  en: {
    subject: (title: string) => `Your 3DPIY purchase: ${title}`,
    heading: "Thank you for your order!",
    bought: (title: string, license: string) => `You bought ${title} (${license}).`,
    library:
      "Your files are ready in your library. Sign in with this email address — no account yet? Create one with this address and your purchase is there automatically.",
    button: "Go to my library",
    waiver:
      "As you agreed at checkout, delivery started right after payment, so the 14-day right of withdrawal does not apply to this purchase.",
    receipt: "Polar, which handles the payment, sends you the receipt separately.",
  },
  nl: {
    subject: (title: string) => `Je 3DPIY-aankoop: ${title}`,
    heading: "Bedankt voor je bestelling!",
    bought: (title: string, license: string) => `Je kocht ${title} (${license}).`,
    library:
      "Je bestanden staan klaar in je bibliotheek. Log in met dit e-mailadres — nog geen account? Maak er een aan met dit adres, dan staat je aankoop er meteen in.",
    button: "Naar mijn bibliotheek",
    waiver:
      "Zoals je bij het afrekenen hebt aangegeven, is de levering direct na betaling begonnen. Daarom geldt de bedenktijd van 14 dagen niet voor deze aankoop.",
    receipt: "Polar, dat de betaling verzorgt, stuurt je de betaalbon apart.",
  },
};

export async function sendPurchaseMail(params: {
  email: string;
  productId: string;
  tier: PriceTier | null;
  locale: string;
}) {
  if (!isMailConfigured()) return;
  const admin = createAdminClient();
  if (!admin) return;
  const { data: product } = await admin
    .from("products")
    .select("title, title_nl, category")
    .eq("id", params.productId)
    .maybeSingle();
  if (!product) return;

  const nl = params.locale === "nl";
  const c = nl ? COPY.nl : COPY.en;
  const title = (nl && product.title_nl) || product.title;
  // Tier names are English product names (as at checkout).
  const license = tierNames(product.category)[params.tier ?? "personal"];
  const library = `${siteUrl()}${nl ? "/nl" : ""}/account`;

  await sendMail({
    to: params.email,
    subject: c.subject(title),
    text: [c.heading, c.bought(title, license), c.library, `${c.button}: ${library}`, c.waiver, c.receipt].join("\n\n"),
    html: emailLayout({
      locale: nl ? "nl" : "en",
      heading: c.heading,
      bodyHtml: `<p style="margin:0 0 16px">${escapeHtml(c.bought(title, license))}</p>
<p style="margin:0 0 16px">${escapeHtml(c.library)}</p>
<p style="margin:0 0 16px">${emailButton(library, c.button)}</p>
<p style="margin:0 0 12px;font-size:13px;color:#6b6478">${escapeHtml(c.waiver)}</p>
<p style="margin:0;font-size:13px;color:#6b6478">${escapeHtml(c.receipt)}</p>`,
    }),
  });
}
