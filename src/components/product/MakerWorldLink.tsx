import { useTranslations } from "next-intl";

/**
 * Free designs that are also on MakerWorld: a download via MakerWorld /
 * Bambu Studio earns Carmen MakerWorld points.
 */
export function MakerWorldLink({ url }: { url: string }) {
  const t = useTranslations("productPage.makerWorld");
  const id = url.match(/models\/(\d+)/)?.[1];
  return (
    <div className="border-line flex flex-col gap-2 border-t pt-5">
      <p className="text-ink text-sm font-semibold">{t("title")}</p>
      <p className="text-ink text-sm">{t("body", { id: id ? `#${id}` : "" })}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-paper text-ink hover:bg-brand-purple/45 hover:border-brand-purple inline-flex w-fit items-center gap-2 rounded-full border border-white px-5 py-2.5 text-sm font-semibold transition-colors hover:text-white"
      >
        {t("button")} ↗
      </a>
    </div>
  );
}
