import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CollectionCard } from "@/components/product/CollectionCard";
import { ACTIVE_COLLECTION_LIST } from "@/lib/config/colors";
import { TRACK_COOKIE, isTrack } from "@/lib/config/track";

export async function generateMetadata() {
  const t = await getTranslations("shopPage");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ShopPage() {
  const t = await getTranslations("shopPage");
  const cookieStore = await cookies();
  const track = cookieStore.get(TRACK_COOKIE)?.value;
  // Each track gets its own shop: once a visitor has picked Dolls or
  // Serious Games (see src/proxy.ts), this only shows that track's
  // collections instead of mixing both — same cookie Header/Footer use.
  const collections = isTrack(track)
    ? ACTIVE_COLLECTION_LIST.filter((c) => c.track === track)
    : ACTIVE_COLLECTION_LIST;

  return (
    <Container className="flex flex-col gap-10 py-16 sm:py-24">
      <SectionHeading
        as="h1"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.slug} slug={collection.slug} headingLevel="h2" />
        ))}
      </div>
    </Container>
  );
}
