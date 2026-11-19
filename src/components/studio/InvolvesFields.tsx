"use client";

import { useState } from "react";

const OPTIONS = [
  { value: "print", label: "3D printing" },
  { value: "sew", label: "Sewing" },
  { value: "parts", label: "Extra parts (magnets, screws…)" },
  { value: "electronics", label: "Electronics" },
  { value: "paint", label: "Painting / finishing" },
] as const;

/**
 * "What's involved" ticks. Untouched = Auto (the product page works it
 * out from the type, extra parts and collection); once a box is clicked
 * the ticks are saved as chosen (involvesSet).
 */
export function InvolvesFields({ initial }: { initial: string[] | null }) {
  const [touched, setTouched] = useState(initial !== null && initial.length > 0);
  const [ticked, setTicked] = useState<string[]>(initial ?? []);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">What&apos;s involved</legend>
      <input type="hidden" name="involvesSet" value={touched ? "1" : "0"} />
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {OPTIONS.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="involves"
              value={o.value}
              checked={ticked.includes(o.value)}
              onChange={(e) => {
                setTouched(true);
                setTicked((t) => (e.target.checked ? [...t, o.value] : t.filter((x) => x !== o.value)));
              }}
              className="h-4 w-4"
            />
            {o.label}
          </label>
        ))}
      </div>
      <p className="text-ink/60 text-xs">
        {touched ? (
          <button type="button" onClick={() => { setTouched(false); setTicked([]); }} className="underline">
            Back to Auto
          </button>
        ) : (
          "Auto: printing (or sewing for a pattern), extra parts when listed, electronics in Tech & Electronics. Tick to choose yourself."
        )}
      </p>
    </fieldset>
  );
}
