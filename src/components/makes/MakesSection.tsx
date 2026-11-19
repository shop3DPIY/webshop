import { getTranslations } from "next-intl/server";
import { getApprovedMakes } from "@/lib/makes/server";
import { MakeShare } from "./MakeShare";

/** Product page: buyers' photos of their print, plus "share yours". */
export async function MakesSection({ productId }: { productId: string }) {
  const t = await getTranslations("makes");
  const makes = await getApprovedMakes(productId);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="makes-title">
      <div>
        <h2 id="makes-title" className="font-display text-ink text-2xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-ink/70 mt-1 text-sm">
          {makes.length > 0 ? t("intro") : t("empty")}
        </p>
      </div>
      {makes.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {makes.map((m) => (
            <figure key={m.id} className="flex flex-col gap-2 rounded-3xl p-2 glass">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.imageUrl}
                alt={m.caption || t("photoAlt")}
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover"
              />
              <figcaption className="px-1 pb-1 text-xs">
                {m.caption && <span className="text-ink block">{m.caption}</span>}
                {m.displayName && (
                  <span className="text-ink/60">— {m.displayName}</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <div>
        <MakeShare productId={productId} />
      </div>
    </section>
  );
}
