import type { Metadata } from "next";
import { fontHeading, fontBody } from "@/lib/config/fonts";
import "../globals.css";

/**
 * 3DPIY Studio is a deliberately separate root (own <html>/<body>, no
 * Header/Footer/locale routing) — it's an internal owner-only tool, not
 * part of the public bilingual site. English-only on purpose: the person
 * using it is always the shop owner.
 */
export const metadata: Metadata = {
  title: "3DPIY Studio",
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontHeading.variable} ${fontBody.variable} h-full antialiased`}
    >
      <body className="bg-paper text-ink min-h-full">{children}</body>
    </html>
  );
}
