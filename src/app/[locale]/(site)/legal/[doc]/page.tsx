import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";

const LEGAL_DOCS = ["privacy", "cookies", "terms", "delivery", "license"] as const;
type LegalDoc = (typeof LEGAL_DOCS)[number];

function isLegalDoc(doc: string): doc is LegalDoc {
  return (LEGAL_DOCS as readonly string[]).includes(doc);
}

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
  const t = await getTranslations(`legal.docs.${doc}`);
  return { title: t("title") };
}

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  if (!isLegalDoc(doc)) notFound();

  const tDoc = await getTranslations(`legal.docs.${doc}`);
  const tLegal = await getTranslations("legal");

  return (
    <Container className="flex flex-col gap-6 py-16 sm:py-24">
      <h1 className="font-display text-ink text-3xl font-bold sm:text-4xl">
        {tDoc("title")}
      </h1>

      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-semibold">{tLegal("noticeTitle")}</p>
        <p className="text-ink/70 mt-1 text-sm">{tLegal("noticeBody")}</p>
      </div>

      <p className="text-ink/70 text-base">{tLegal("placeholderBody")}</p>
    </Container>
  );
}
