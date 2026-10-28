import Script from "next/script";

/**
 * Umami Cloud page-view analytics: cookieless, so no consent banner is
 * needed. Off until NEXT_PUBLIC_UMAMI_WEBSITE_ID is set, and data-domains
 * keeps localhost and Netlify deploy previews out of the stats. Studio and
 * the coming-soon page live outside the [locale] tree, so they're never
 * counted.
 *
 * Custom events: add data-umami-event="name" to a button or link.
 */
export function Analytics() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) return null;
  return (
    <Script
      src="https://cloud.umami.is/script.js"
      data-website-id={websiteId}
      data-domains="3dpiy.com,www.3dpiy.com"
      strategy="afterInteractive"
    />
  );
}
