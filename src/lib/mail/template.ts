/**
 * The shared look of every 3DPIY email: a white card with a purple
 * heading and footer. Inline styles only — mail clients ignore <style>.
 */
const PURPLE = "#8c52ff";

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
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f3eefc;font-family:Helvetica,Arial,sans-serif;color:#14121a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e7e3f0">
<tr><td style="padding:28px 32px 8px"><div style="font-size:13px;font-weight:bold;letter-spacing:2px;color:${PURPLE}">3DPIY</div>
<h1 style="margin:8px 0 16px;font-size:22px;color:${PURPLE}">${escapeHtml(heading)}</h1></td></tr>
<tr><td style="padding:0 32px 16px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid #eee;font-size:12px;color:#6b6478">${footerHtml}3DPIY — Print It Yourself · <a href="https://3dpiy.com" style="color:${PURPLE}">3dpiy.com</a></td></tr>
</table></td></tr></table></body></html>`;
}
