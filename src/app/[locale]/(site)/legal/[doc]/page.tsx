import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { BackButton } from "@/components/ui/BackButton";
import { LegalBody } from "@/components/legal/LegalBody";
import { DEFAULT_LEGAL_DATE, LEGAL_DOCS, isLegalDoc } from "@/content/legal";
import { getLegalText } from "@/lib/settings/legal";

export function generateStaticParams() {
  return LEGAL_DOCS.map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  if (!isLegalDoc(doc)) return {};
  const text = await getLegalText(doc, await getLocale());
  return { title: text.title };
}

/** Legal pages — texts and business details come from Studio → Legal / Settings. */
export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  if (!isLegalDoc(doc)) notFound();

  const locale = await getLocale();
  const tLegal = await getTranslations("legal");
  const text = await getLegalText(doc, locale);
  const updated = new Date(text.updatedAt ?? DEFAULT_LEGAL_DATE).toLocaleDateString(
    locale === "nl" ? "nl-NL" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  return (
    <Container panel className="flex flex-col gap-6 py-16 sm:py-24">
      <BackButton label={tLegal("back")} />
      <div>
        <h1 className="font-display text-ink text-3xl font-bold sm:text-4xl">{text.title}</h1>
        <p className="text-ink mt-2 text-sm">{tLegal("updated", { date: updated })}</p>
      </div>
      <div className="max-w-3xl">
        <LegalBody text={text.body} />
      </div>
    </Container>
  );
}
