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
import { TrackSwitcher } from "./TrackSwitcher";
import { TRACK_COOKIE } from "@/lib/config/track";

export async function Header() {
  const t = await getTranslations("nav");
  const cookieStore = await cookies();
  const track = cookieStore.get(TRACK_COOKIE)?.value;
  // Serious Games is the no-pink B2B track (see Button.tsx's "Alt" variants) —
  // the Contact button follows the same rule.
  const isSeriousGames = track === "serious-games";
  // Business/commercial licensing only exists for Serious Games today — see
  // src/app/[locale]/(site)/business/page.tsx's Dolls placeholder.
  const isDolls = track === "dolls";

  return (
    <header className="border-line bg-paper sticky top-0 z-40 border-b shadow-xl backdrop-blur-lg">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <TrackSwitcher />
          <Logo />
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/shop"
            className="text-ink hover:text-ink/70 text-sm font-medium"
          >
            {t("shop")}
          </Link>
          {!isDolls && (
            <Link
              href="/business"
              className="text-ink hover:text-ink/70 text-sm font-medium"
            >
              {t("business")}
            </Link>
          )}
          <Link
            href="/about"
            className="text-ink hover:text-ink/70 text-sm font-medium"
          >
            {t("about")}
          </Link>
        </nav>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <AccountLink />
            <div className="hidden md:block">
              <Button href="/contact" size="md" variant={isSeriousGames ? "accentAlt" : "primary"}>
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
