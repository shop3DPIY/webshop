import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AccountLink } from "./AccountLink";
import { MobileMenu } from "./MobileMenu";
import { TRACK_COOKIE, isTrack } from "@/lib/config/track";

export async function Header() {
  const t = await getTranslations("nav");
  const cookieStore = await cookies();
  const track = cookieStore.get(TRACK_COOKIE)?.value;
  const otherTrack = isTrack(track)
    ? track === "dolls"
      ? { href: "/serious-games", label: t("switchToSeriousGames") }
      : { href: "/dolls", label: t("switchToDolls") }
    : null;

  const navLinks = [
    { href: "/shop", label: t("shop") },
    { href: "/business", label: t("business") },
    { href: "/about", label: t("about") },
  ];

  return (
    <header className="border-line bg-paper/90 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-brand-purple hover:text-brand-periwinkle text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {otherTrack && (
            <Link
              href={otherTrack.href}
              className="border-brand-purple/40 text-brand-purple hover:bg-brand-purple/10 hidden rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex"
            >
              {otherTrack.label}
            </Link>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
          <AccountLink />
          <div className="hidden md:block">
            <Button href="/contact" size="md">
              {t("contact")}
            </Button>
          </div>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
