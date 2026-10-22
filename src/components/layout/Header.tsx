import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AccountLink } from "./AccountLink";
import { MobileMenu } from "./MobileMenu";
import { BusinessNavLink } from "./BusinessNavLink";
import { TrackSwitcher } from "./TrackSwitcher";

export async function Header() {
  const t = await getTranslations("nav");

  return (
    <header className="border-line bg-paper sticky top-0 z-40 border-b shadow-xl backdrop-blur-lg">
      <Container className="flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <TrackSwitcher />
          <Logo className="h-16 w-auto" />
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/shop"
            className="text-ink hover:text-brand-purple text-sm font-medium"
          >
            {t("shop")}
          </Link>
          <BusinessNavLink className="text-ink hover:text-brand-purple text-sm font-medium" />
          <Link
            href="/about"
            className="text-ink hover:text-brand-purple text-sm font-medium"
          >
            {t("about")}
          </Link>
        </nav>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <AccountLink />
            <div className="hidden md:block">
              <Button href="/contact" size="md" variant="secondary" className="h-10 py-0">
                {t("contact")}
              </Button>
            </div>
          </div>
          <div className="border-line bg-mist/60 flex items-center gap-1 rounded-full border p-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
