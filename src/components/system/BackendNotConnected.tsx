import { useTranslations } from "next-intl";

export function BackendNotConnected() {
  const t = useTranslations("notConnected");

  return (
    <div className="mx-auto max-w-lg rounded-3xl p-8 text-center glass">
      <h1 className="font-display text-xl font-semibold">{t("title")}</h1>
      <p className="text-ink/70 mt-2 text-sm">{t("body")}</p>
    </div>
  );
}
