import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** The most prominent header action: a filled icon button, same height as Contact. */
export function AccountLink() {
  const t = useTranslations("nav");

  return (
    <Link
      href="/account"
      title={t("account")}
      className="border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-lg transition-colors"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        aria-hidden
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
      <span className="sr-only">{t("account")}</span>
    </Link>
  );
}
