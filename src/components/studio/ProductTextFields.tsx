"use client";

import { useEffect, useRef, useState } from "react";
import { generateProductTextAction } from "@/lib/studio/actions";

const FIELD =
  "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";
const BUTTON_SECONDARY =
  "border-line bg-mist hover:border-brand-purple hover:bg-brand-purple/45 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50";

type Texts = {
  title: string;
  description: string;
  titleNl: string;
  descriptionNl: string;
};

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
  const [suggestion, setSuggestion] = useState<Texts | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Slug (leave empty to auto-generate)
          <input
            type="text"
            name="slug"
            defaultValue={slug}
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
          rows={3}
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
        <label className={LABEL}>
          Description (Dutch)
          <textarea
            name="descriptionNl"
            value={texts.descriptionNl}
            onChange={set("descriptionNl")}
            rows={3}
            className={FIELD}
          />
        </label>
      </section>

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
          className={BUTTON_SECONDARY}
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
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setTexts(suggestion);
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
