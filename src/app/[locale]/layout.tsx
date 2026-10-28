import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { TRACK_COOKIE, parseTrack } from "@/lib/config/track";
import "../globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TrackSync } from "@/components/system/TrackSync";
import { routing, type Locale } from "@/i18n/routing";
import { fontHeading, fontBody } from "@/lib/config/fonts";
import { InputModality } from "@/components/system/InputModality";
import { Analytics } from "@/components/system/Analytics";

const siteUrl = "https://3dpiy.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "3DPIY — Print It Yourself",
    template: "%s · 3DPIY",
  },
  description:
    "3DPIY — Our Designs. Your Prints. Original digital design files for 3D printing: IKEA hacks, home decor, organization, electronics enclosures, doll & dollhouse miniatures and serious games.",
  openGraph: {
    type: "website",
    siteName: "3DPIY",
    title: "3DPIY — Print It Yourself",
    description: "Our Designs. Your Prints.",
    url: siteUrl,
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const cookieStore = await cookies();
  const isDark = cookieStore.get("theme")?.value === "dark";
  // Drives the per-track backdrop and button color (see globals.css).
  const track = parseTrack(cookieStore.get(TRACK_COOKIE)?.value);

  return (
    <html
      lang={locale}
      data-track={track}
      className={`${fontHeading.variable} ${fontBody.variable} h-full antialiased ${isDark ? "dark" : ""}`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <InputModality />
        <NextIntlClientProvider locale={locale as Locale} messages={messages}>
          <ThemeProvider initialTheme={isDark ? "dark" : "light"}>
            {children}
            <TrackSync />
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
