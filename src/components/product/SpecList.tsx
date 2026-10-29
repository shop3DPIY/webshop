import { Link } from "@/i18n/navigation";

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
        <div key={row.label} className="flex justify-between gap-6 py-3 text-sm">
          <dt className="text-ink/60">{row.label}</dt>
          <dd className="text-right font-medium">
            {row.hint ? (
              <details className="group">
                <summary
                  title={row.hint.text}
                  className="cursor-help list-none underline decoration-dotted underline-offset-4"
                >
                  {row.value}{" "}
                  <span aria-hidden className="text-ink/60">
                    ⓘ
                  </span>
                </summary>
                <p className="text-ink/70 mt-2 max-w-xs text-left text-xs font-normal">
                  {row.hint.text}{" "}
                  <Link href={row.hint.href} className="underline underline-offset-2">
                    {row.hint.linkLabel}
                  </Link>
                </p>
              </details>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
