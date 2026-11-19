import Link from "next/link";
import { TEXT_DOCS } from "@/content/legal";
import { getLegalSource } from "@/lib/settings/legal";

/** The five legal pages; each opens an editor with English and Dutch. */
export default async function StudioLegalPage() {
  const docs = await Promise.all(
    TEXT_DOCS.map(async (doc) => ({ doc, source: await getLegalSource(doc) })),
  );
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Texts</h1>
        <p className="text-ink mt-1 max-w-2xl text-sm">
          The legal pages and the FAQs (Shop and Business). Pages you
          haven&apos;t edited show the default text. Business details (KvK,
          address…) come from Settings.
        </p>
      </div>
      <div className="divide-line divide-y rounded-3xl glass">
        {docs.map(({ doc, source }) => (
          <Link
            key={doc}
            href={`/studio/legal/${doc}`}
            className="hover:bg-mist flex items-center justify-between gap-4 p-5 text-sm transition-colors first:rounded-t-3xl last:rounded-b-3xl"
          >
            <span className="font-semibold">
              {source.en.title} <span className="text-ink font-normal">· {source.nl.title}</span>
            </span>
            <span className="text-ink text-xs">
              {source.edited
                ? `Edited ${new Date(source.updatedAt!).toLocaleDateString("nl-NL", { dateStyle: "medium" })}`
                : "Default text"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
