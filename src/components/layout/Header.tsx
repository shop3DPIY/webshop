import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AccountLink } from "./AccountLink";
import { MobileMenu } from "./MobileMenu";
import { TrackSwitcher } from "./TrackSwitcher";

export async function Header() {
  const t = await getTranslations("nav");

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
          <TrackSwitcher />
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
