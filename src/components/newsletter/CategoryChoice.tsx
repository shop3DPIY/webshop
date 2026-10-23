"use client";

import { useState } from "react";

/**
 * "All categories" / "Only these categories" + the category checkboxes.
 * Ticking a category switches the choice to "only these"; choosing "all"
 * clears the ticks, so what you see is what gets saved.
 */
export function CategoryChoice({
  initialAll,
  initialSelected,
  categories,
  labels,
}: {
  initialAll: boolean;
  initialSelected: string[];
  categories: { slug: string; name: string; color: string }[];
  labels: { all: string; some: string };
}) {
  const [all, setAll] = useState(initialAll);
  const [selected, setSelected] = useState<string[]>(
    initialAll ? [] : initialSelected,
  );

  const toggle = (slug: string, on: boolean) => {
    const next = on ? [...selected, slug] : selected.filter((s) => s !== slug);
    setSelected(next);
    setAll(next.length === 0);
  };

  return (
    <>
      <input type="hidden" name="mode" value={all ? "all" : "some"} />
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="radio"
          checked={all}
          onChange={() => {
            setAll(true);
            setSelected([]);
          }}
        />
        {labels.all}
      </label>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="radio" checked={!all} onChange={() => setAll(false)} />
        {labels.some}
      </label>
      <div className="grid grid-cols-1 gap-2 pl-8 sm:grid-cols-2">
        {categories.map((c) => (
          <label
            key={c.slug}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm glass"
            style={{ borderColor: c.color }}
          >
            <input
              type="checkbox"
              name="categories"
              value={c.slug}
              checked={selected.includes(c.slug)}
              onChange={(e) => toggle(c.slug, e.target.checked)}
            />
            {c.name}
          </label>
        ))}
      </div>
    </>
  );
}
