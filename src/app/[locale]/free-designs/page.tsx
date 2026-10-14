import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";
import { getFreeProducts } from "@/lib/products";

export async function generateMetadata() {
  const t = await getTranslations("freeDesignsPage");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function FreeDesignsPage() {
  const t = await getTranslations("freeDesignsPage");
  const products = await getFreeProducts();

  return (
    <Container className="flex flex-col gap-10 py-16 sm:py-24">
      <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="border-line rounded-3xl border border-dashed p-12 text-center">
          <h2 className="font-display text-xl font-semibold">{t("emptyTitle")}</h2>
          <p className="text-ink/60 mt-2 text-sm">{t("emptyDescription")}</p>
        </div>
      )}
    </Container>
  );
}
