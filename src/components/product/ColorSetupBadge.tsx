import { useTranslations } from "next-intl";

/** "Multicolour · AMS" / "No AMS needed" — product page and cards. */
export function ColorSetupBadge({
  setup,
  className = "",
}: {
  setup: "ams" | "no-ams";
  className?: string;
}) {
  const t = useTranslations("productCard");
  return (
    <span
      className={`border-line inline-flex w-fit items-center gap-1.5 rounded-full border bg-white/40 px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {setup === "ams" ? (
        <span aria-hidden className="flex">
          <span className="h-2 w-2 rounded-full bg-[#ff5ca8]" />
          <span className="-ml-0.5 h-2 w-2 rounded-full bg-[#5ce1e6]" />
          <span className="-ml-0.5 h-2 w-2 rounded-full bg-[#8c52ff]" />
        </span>
      ) : (
        <span aria-hidden className="bg-ink/60 h-2 w-2 rounded-full" />
      )}
      {t(setup === "ams" ? "ams" : "noAms")}
    </span>
  );
}
