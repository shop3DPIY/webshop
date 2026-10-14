import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { COLLECTION_LIST } from "@/lib/config/colors";

export async function generateMetadata() {
  const t = await getTranslations("shopPage");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ShopPage() {
  const t = await getTranslations("shopPage");

  return (
    <Container className="flex flex-col gap-10 py-16 sm:py-24">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTION_LIST.map((collection) => (
          <CollectionCard key={collection.slug} slug={collection.slug} headingLevel="h2" />
        ))}
      </div>
    </Container>
  );
}
