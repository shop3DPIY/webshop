"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = {
  en: "EN",
  nl: "NL",
  // de: "DE",
  // fr: "FR",
};

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  // --action follows the track (purple on the Shop, cyan on Serious Games).
  const activeClasses = "border border-action bg-action text-on-action";

  return (
    <div className="flex items-center gap-1" aria-label={t("label")}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-current={loc === locale}
          className={`flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors ${
            loc === locale ? activeClasses : "border border-transparent text-ink hover:border-brand-purple hover:bg-brand-purple/45 hover:text-white"
          }`}
        >
          {LABELS[loc] ?? loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
