import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Everything except the track chooser (src/app/[locale]/page.tsx) lives in
 * this group — it's what gets the normal site chrome (header/nav, footer).
 * The chooser is a standalone full-screen start page with no navbar at all,
 * so it sits one level up, outside this group.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const tNav = await getTranslations("nav");

  return (
    <>
      <a
        href="#main-content"
        className="bg-brand-cyan text-night hover:bg-brand-purple hover:text-white transition-colors focus:top-4 focus:left-4 fixed -top-20 left-4 z-50 rounded-full px-4 py-2 text-sm font-semibold focus:outline-none"
      >
        {tNav("skipToContent")}
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
