"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

/**
 * A spec value with an ⓘ explanation that opens and closes on tap (or
 * click), and also closes on a tap elsewhere or Escape — on phones a
 * hover title never shows, and a <details> stayed open.
 */
export function SpecHint({
  value,
  hint,
}: {
  value: string;
  hint: { text: string; linkLabel: string; href: string };
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={root} className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title={hint.text}
        className="cursor-help underline decoration-dotted underline-offset-4"
      >
        {value}{" "}
        <span aria-hidden className="text-ink/60">
          {open ? "×" : "ⓘ"}
        </span>
      </button>
      {open && (
        <span className="text-ink/70 mt-2 block max-w-xs text-left text-xs font-normal">
          {hint.text}{" "}
          <Link href={hint.href} className="underline underline-offset-2">
            {hint.linkLabel}
          </Link>
        </span>
      )}
    </span>
  );
}
