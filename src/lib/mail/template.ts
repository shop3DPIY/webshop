/**
 * The shared look of every 3DPIY email: a white card on the site's soft
 * pink-to-purple backdrop, purple heading, pill buttons like the site's.
 * Inline styles only — most mail clients ignore <style>.
 *
 * Light only on purpose: Apple Mail's automatic dark mode otherwise
 * repaints the colours (white button text turned dark purple on purple).
 */
const PURPLE = "#8c52ff";

/** A compact pill button, like the site's (px-5 py-2.5, text-sm, semibold). */
export function emailButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;margin:0 8px 8px 0;padding:9px 18px;border-radius:999px;background:${PURPLE};border:1px solid ${PURPLE};color:#ffffff !important;font-size:14px;line-height:1.3;font-weight:600;text-decoration:none">${escapeHtml(label)}</a>`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text → HTML paragraphs (blank line = new paragraph, newline = <br>). */
export function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

export function emailLayout({
  heading,
  bodyHtml,
  footerHtml = "",
}: {
  heading: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><style>:root{color-scheme:light only;supported-color-schemes:light only}</style></head>
<body style="margin:0;padding:24px 12px;background:#efe6fb;background-image:linear-gradient(135deg,#fbe3f1 0%,#ece2fd 55%,#dfe9fd 100%);font-family:Helvetica,Arial,sans-serif;color:#14121a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;border:1px solid #ffffff;box-shadow:0 8px 24px rgba(140,82,255,0.12)">
<tr><td style="padding:24px 24px 4px"><div style="font-size:12px;font-weight:bold;letter-spacing:2px;color:${PURPLE}">3DPIY</div>
<h1 style="margin:6px 0 12px;font-size:20px;line-height:1.3;color:#14121a">${escapeHtml(heading)}</h1></td></tr>
<tr><td style="padding:0 24px 12px;font-size:15px;line-height:1.55">${bodyHtml}</td></tr>
<tr><td style="padding:14px 24px 22px;border-top:1px solid #f0ebf8;font-size:12px;line-height:1.5;color:#6b6478">${footerHtml}3DPIY — Print It Yourself · <a href="https://3dpiy.com" style="color:${PURPLE}">3dpiy.com</a></td></tr>
</table></td></tr></table></body></html>`;
}
