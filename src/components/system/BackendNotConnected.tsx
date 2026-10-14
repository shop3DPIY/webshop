import { useTranslations } from "next-intl";

export function BackendNotConnected() {
  const t = useTranslations("notConnected");

  return (
    <div className="border-accent/30 bg-accent/5 mx-auto max-w-lg rounded-3xl border p-8 text-center">
      <h1 className="font-display text-xl font-semibold">{t("title")}</h1>
      <p className="text-ink/70 mt-2 text-sm">{t("body")}</p>
    </div>
  );
}
