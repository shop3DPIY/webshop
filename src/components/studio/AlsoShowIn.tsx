"use client";

import { useEffect, useRef, useState } from "react";

interface Group {
  track: string;
  label: string;
  collections: { slug: string; name: string; color: string; track: string }[];
}

/**
 * "Also show in": extra collections next to the main one. The main
 * Collection (the select above, in the same form) shows here ticked and
 * locked with "main", so it's clear where the product lives; collections
 * on the other track are locked too, because they'd never be saved
 * (Serious Games / Business stays separate — see extraCategoriesFor).
 */
export function AlsoShowIn({
  groups,
  initialCategory,
  initialExtra,
}: {
  groups: Group[];
  initialCategory: string;
  initialExtra: string[];
}) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const [main, setMain] = useState(initialCategory);
  const [extra, setExtra] = useState(new Set(initialExtra));

  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onChange = (e: Event) => {
      const target = e.target as HTMLSelectElement;
      if (target.name === "category") setMain(target.value);
    };
    form.addEventListener("change", onChange);
    return () => form.removeEventListener("change", onChange);
  }, []);

  const mainTrack = groups
    .flatMap((g) => g.collections)
    .find((c) => c.slug === main)?.track;

  return (
    <fieldset ref={ref} className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Also show in</legend>
      <p className="text-ink/60 text-xs">
        Extra collections this product also appears in. The main collection
        (chosen above) is marked &ldquo;main&rdquo;; change it with the
        Collection menu. Collections on the other track can&apos;t be combined.
      </p>
      {groups.map((group) => (
        <div key={group.track} className="flex flex-col gap-2">
          <span className="text-ink/60 text-xs font-semibold uppercase">
            {group.label}
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.collections.map((c) => {
              const isMain = c.slug === main;
              const otherTrack = c.track !== mainTrack;
              const locked = isMain || otherTrack;
              return (
                <label
                  key={c.slug}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    isMain
                      ? "border border-white bg-white/35 font-semibold"
                      : "bg-white/20"
                  } ${otherTrack ? "opacity-50" : ""}`}
                  title={
                    isMain
                      ? "Main collection — change it with the Collection menu"
                      : otherTrack
                        ? "Other track — can't be combined with the main collection"
                        : undefined
                  }
                >
                  <input
                    type="checkbox"
                    // The main one is never sent: it's already the main.
                    name={locked ? undefined : "extraCategories"}
                    value={c.slug}
                    checked={isMain || (!otherTrack && extra.has(c.slug))}
                    disabled={locked}
                    onChange={(e) =>
                      setExtra((s) => {
                        const next = new Set(s);
                        if (e.target.checked) next.add(c.slug);
                        else next.delete(c.slug);
                        return next;
                      })
                    }
                  />
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    {c.name}
                    {isMain && (
                      <span className="text-ink/70 ml-1 text-xs font-normal">
                        (main)
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
