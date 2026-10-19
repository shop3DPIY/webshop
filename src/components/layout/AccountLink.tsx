import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AccountLink() {
  const t = useTranslations("account");

  return (
    <Link
      href="/account"
      aria-label={t("title")}
      className="border-brand-purple/30 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
    </Link>
  );
}
