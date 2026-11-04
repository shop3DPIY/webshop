import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

/** 404 inside the normal site (header, footer) instead of Next's bare black page. */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <Container panel className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
      <p className="text-ink/60 text-sm font-semibold tracking-widest">404</p>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{t("title")}</h1>
      <p className="text-ink/70 max-w-md">{t("body")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button href="/shop" size="lg">
          {t("shop")}
        </Button>
        <Button href="/contact" variant="secondary" size="lg">
          {t("contact")}
        </Button>
      </div>
    </Container>
  );
}
