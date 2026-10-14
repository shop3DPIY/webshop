import type { Metadata } from "next";
import { fontHeading, fontBody } from "@/lib/config/fonts";
import "../globals.css";

/**
 * Deliberately separate root (own <html>/<body>, no Header/Footer, no nav)
 * — same pattern as src/app/studio/layout.tsx. While the site is gated
 * (see src/lib/config/siteMode.ts), proxy.ts rewrites every other page to
 * this one, so there is no link, nav item or direct URL that leads
 * anywhere else.
 */
export const metadata: Metadata = {
  title: "3DPIY — Coming soon",
  robots: { index: false, follow: false },
};

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontHeading.variable} ${fontBody.variable} h-full antialiased`}>
      <body className="bg-paper text-ink min-h-full">{children}</body>
    </html>
  );
}
