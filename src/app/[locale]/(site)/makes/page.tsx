import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Link } from "@/i18n/navigation";
import { getAllApprovedMakes } from "@/lib/makes/server";

export async function generateMetadata() {
  const t = await getTranslations("makesPage");
  return { title: t("title"), description: t("description") };
}

/** Every buyer photo approved in Studio → Makes, each linking to its design. */
export default async function MakesPage() {
  const t = await getTranslations("makesPage");
  const locale = await getLocale();
  const makes = await getAllApprovedMakes();

  return (
    <Container panel className="flex flex-col gap-10 py-12 sm:py-16">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      {makes.length === 0 ? (
        <p className="text-ink rounded-3xl p-8 text-center glass">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {makes.map((m) => {
            const title = (locale === "nl" && m.product.titleNl) || m.product.title;
            return (
              <Link
                key={m.id}
                href={`/product/${m.product.slug}`}
                className="hover:bg-mist flex flex-col gap-2 rounded-3xl p-2 glass transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.imageUrl}
                  alt={m.caption || t("photoAlt", { title })}
                  loading="lazy"
                  className="aspect-square w-full rounded-2xl object-cover"
                />
                <span className="px-1 pb-1 text-xs">
                  <span className="text-ink block font-semibold">{title}</span>
                  {m.caption && <span className="text-ink block">{m.caption}</span>}
                  {m.displayName && <span className="text-ink">— {m.displayName}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
