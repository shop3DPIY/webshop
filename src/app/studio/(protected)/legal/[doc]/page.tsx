import Link from "next/link";
import { notFound } from "next/navigation";
import { isLegalDoc } from "@/content/legal";
import { getLegalSource } from "@/lib/settings/legal";
import { resetLegalDocument, saveLegalDocument } from "@/lib/settings/admin-actions";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmDialog";

const FIELD = "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

/** Edit one legal page, English (the base) and Dutch side by side. */
export default async function StudioLegalDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ doc: string }>;
  searchParams: Promise<{ saved?: string; reset?: string; error?: string }>;
}) {
  const { doc } = await params;
  if (!isLegalDoc(doc)) notFound();
  const { saved, reset, error } = await searchParams;
  const source = await getLegalSource(doc);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/studio/legal" className="text-ink/60 hover:text-ink text-sm">
            ← Legal
          </Link>
          <h1 className="font-display mt-1 text-2xl font-bold">{source.en.title}</h1>
        </div>
        <div className="flex gap-2">
          <a href={`/legal/${doc}`} target="_blank" className="border-line hover:bg-mist rounded-full border px-4 py-2 text-sm font-semibold">
            View EN ↗
          </a>
          <a href={`/nl/legal/${doc}`} target="_blank" className="border-line hover:bg-mist rounded-full border px-4 py-2 text-sm font-semibold">
            View NL ↗
          </a>
        </div>
      </div>

      {(saved || reset || error) && (
        <p
          role="status"
          className={`w-fit rounded-full border px-4 py-2 text-sm font-medium ${
            error ? "border-red-300 text-red-200" : "border-brand-purple bg-brand-purple/25"
          }`}
        >
          {error === "empty"
            ? "Fill in all four fields."
            : error
              ? `Couldn't save: ${error}`
              : saved
                ? "✓ Saved — the page on the site is updated."
                : "✓ Back to the default text."}
        </p>
      )}

      <div className="text-ink/70 max-w-4xl rounded-3xl p-5 text-sm glass">
        <p className="font-semibold">How to write it</p>
        <p className="mt-1">
          <code>## Heading</code> · <code>- bullet</code> · an empty line starts a new
          paragraph · <code>**bold**</code> · <code>[link text](/legal/terms)</code>. Email
          addresses become links by themselves.
        </p>
        <p className="mt-1">
          Filled in from Settings: <code>{"{{company}}"}</code> <code>{"{{owner}}"}</code>{" "}
          <code>{"{{address}}"}</code> <code>{"{{kvk}}"}</code> <code>{"{{vat}}"}</code>{" "}
          <code>{"{{email}}"}</code> <code>{"{{iban}}"}</code> <code>{"{{site}}"}</code>
        </p>
      </div>

      <form action={saveLegalDocument} className="flex flex-col gap-6">
        <input type="hidden" name="slug" value={doc} />
        <div className="grid gap-6 xl:grid-cols-2">
          {(["en", "nl"] as const).map((lang) => (
            <div key={lang} className="flex flex-col gap-4 rounded-3xl p-6 glass">
              <h2 className="font-display text-lg font-semibold">
                {lang === "en" ? "English (base)" : "Dutch (/nl)"}
              </h2>
              <label className={LABEL}>
                Title
                <input name={`title_${lang}`} defaultValue={source[lang].title} required className={FIELD} />
              </label>
              <label className={LABEL}>
                Text
                <textarea
                  name={`body_${lang}`}
                  defaultValue={source[lang].body}
                  required
                  rows={28}
                  className={`${FIELD} font-mono text-xs leading-relaxed`}
                />
              </label>
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover w-fit rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
        >
          Save
        </button>
      </form>

      {source.edited && (
        <form action={resetLegalDocument}>
          <input type="hidden" name="slug" value={doc} />
          <ConfirmSubmitButton
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/70 hover:text-white"
            labels={{
              title: "Go back to the default text?",
              body: "Your edited English and Dutch text for this page are deleted. This can't be undone.",
              confirm: "Yes, use the default",
              cancel: "Cancel",
            }}
          >
            Back to default text
          </ConfirmSubmitButton>
        </form>
      )}
    </div>
  );
}
