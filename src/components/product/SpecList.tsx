import { SpecHint } from "./SpecHint";

interface SpecRow {
  label: string;
  value: string;
  /** Plain-language explanation: shown on hover, and on tap (phones). */
  hint?: { text: string; linkLabel: string; href: string };
}

export function SpecList({ rows }: { rows: SpecRow[] }) {
  if (rows.length === 0) return null;

  return (
    <dl className="divide-line divide-y">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-6 py-3 text-sm"
        >
          <dt className="text-ink/60">{row.label}</dt>
          <dd className="text-right font-medium">
            {row.hint ? (
              <SpecHint value={row.value} hint={row.hint} />
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
