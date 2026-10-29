"use client";

import { useEffect, useRef, useState } from "react";
import { generateProductTextAction } from "@/lib/studio/actions";

const FIELD =
  "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";
/** Same rules as the server's slugify (src/lib/studio/actions.ts). */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Same look as Studio's "Save & set live": stands out without shouting. */
const BUTTON_AI =
  "rounded-full border border-white bg-white/35 px-4 py-2 text-sm font-semibold text-white shadow-md backdrop-blur-lg transition-colors hover:border-brand-purple hover:bg-brand-purple/60 disabled:opacity-50";
const BUTTON_SECONDARY =
  "border-line bg-mist hover:border-brand-purple hover:bg-brand-purple/45 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50";

type Texts = {
  title: string;
  description: string;
  titleNl: string;
  descriptionNl: string;
};
type Suggestion = Texts & { tags?: string[] };

/**
 * Title + description in English and Dutch, with "Text with AI": type
 * anything (Dutch, keywords…), click, and the house-style English + Dutch
 * versions appear as a suggestion — nothing is replaced until you click
 * "Use these texts". Same style as the ingest script (src/lib/ai/productText.ts).
 */
export function ProductTextFields({
  initial,
  slug,
  collectionNames,
  initialCategory,
  aiAvailable,
}: {
  initial: Texts;
  slug?: string;
  collectionNames: Record<string, string>;
  initialCategory: string;
  aiAvailable: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [texts, setTexts] = useState<Texts>(initial);
  const [category, setCategory] = useState(initialCategory);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A new product's slug follows the English title (also after "Use these
  // texts") until you type in the slug field yourself. An existing
  // product keeps its slug: changing it would break links to it.
  const [slugValue, setSlugValue] = useState(slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!slug);
  const shownSlug = slugTouched ? slugValue : slugify(texts.title);

  // The collection select lives elsewhere in the form.
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const onChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target.name === "category") setCategory(target.value);
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);

  const set = (key: keyof Texts) => (e: { target: { value: string } }) =>
    setTexts((t) => ({ ...t, [key]: e.target.value }));

  async function generate() {
    setBusy(true);
    setError(null);
    const result = await generateProductTextAction({
      title: texts.title || texts.titleNl,
      description: [texts.description, texts.descriptionNl]
        .filter(Boolean)
        .join("\n\n"),
      categoryName: collectionNames[category],
    }).catch((e: Error) => ({ ok: false as const, error: e.message }));
    setBusy(false);
    if (result.ok) setSuggestion(result.text);
    else setError(result.error);
  }

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <section className="grid gap-4 sm:grid-cols-2">
        <label className={LABEL}>
          Title (English)
          <input
            type="text"
            name="title"
            value={texts.title}
            onChange={set("title")}
            required
            className={FIELD}
          />
        </label>
        <label className={LABEL}>
          Slug (web address)
          <input
            type="text"
            name="slug"
            value={shownSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlugValue(e.target.value);
            }}
            placeholder="made from the title"
            className={FIELD}
          />
        </label>
      </section>
      <label className={LABEL}>
        Description (English)
        <textarea
          name="description"
          value={texts.description}
          onChange={set("description")}
          required
          rows={4}
          className={FIELD}
        />
      </label>
      <section className="grid gap-4 sm:grid-cols-2">
        <label className={LABEL}>
          Title (Dutch)
          <input
            type="text"
            name="titleNl"
            value={texts.titleNl}
            onChange={set("titleNl")}
            className={FIELD}
          />
        </label>
      </section>
      <label className={LABEL}>
        Description (Dutch)
        <textarea
          name="descriptionNl"
          value={texts.descriptionNl}
          onChange={set("descriptionNl")}
          rows={4}
          className={FIELD}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={
            !aiAvailable ||
            busy ||
            !(
              texts.title ||
              texts.description ||
              texts.titleNl ||
              texts.descriptionNl
            )
          }
          className={BUTTON_AI}
        >
          {busy ? "Writing…" : "✨ Text with AI"}
        </button>
        <span className="text-ink/60 text-xs">
          {aiAvailable
            ? "Type anything — Dutch, English or keywords — and get English + Dutch in the 3DPIY style."
            : "AI isn't set up: add ANTHROPIC_API_KEY to the environment variables."}
        </span>
      </div>
      {error && <p className="text-sm text-red-200">{error}</p>}

      {suggestion && (
        <div className="flex flex-col gap-3 rounded-2xl p-5 glass">
          <p className="text-sm font-semibold">Suggestion</p>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-ink/60 text-xs uppercase">English</p>
              <p className="mt-1 font-semibold">{suggestion.title}</p>
              <p className="text-ink/80 mt-1">{suggestion.description}</p>
            </div>
            <div>
              <p className="text-ink/60 text-xs uppercase">Dutch</p>
              <p className="mt-1 font-semibold">{suggestion.titleNl}</p>
              <p className="text-ink/80 mt-1">{suggestion.descriptionNl}</p>
            </div>
          </div>
          {suggestion.tags && suggestion.tags.length > 0 && (
            <p className="text-ink/70 text-xs">
              <span className="font-semibold">Tags:</span>{" "}
              {suggestion.tags.join(", ")}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                const { tags, ...rest } = suggestion;
                setTexts(rest);
                // The Tags field lives elsewhere in the form: add the
                // suggested search words to whatever is there already.
                const field = ref.current
                  ?.closest("form")
                  ?.querySelector<HTMLInputElement>('input[name="tags"]');
                if (field && tags?.length) {
                  const current = field.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  field.value = [...new Set([...current, ...tags])].join(", ");
                }
                setSuggestion(null);
              }}
              className="border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            >
              Use these texts
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className={BUTTON_SECONDARY}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className={BUTTON_SECONDARY}
            >
              Keep mine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
