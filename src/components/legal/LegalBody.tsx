import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Renders a legal text written in Studio → Legal. A tiny, safe subset of
 * Markdown — no HTML is ever passed through:
 *   "## Heading", "- bullet", blank line = new paragraph,
 *   **bold**, [link text](/path or https://…).
 */

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(<strong key={m.index} className="text-ink font-semibold">{m[1]}</strong>);
    } else {
      const href = m[3];
      const cls = "text-ink font-medium underline underline-offset-2";
      parts.push(
        href.startsWith("/") ? (
          <Link key={m.index} href={href} className={cls}>{m[2]}</Link>
        ) : /^(https?:|mailto:)/.test(href) ? (
          <a key={m.index} href={href} className={cls} target="_blank" rel="noopener noreferrer">{m[2]}</a>
        ) : (
          m[2]
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  // Bare email addresses become mail links.
  return parts.flatMap((part, i): ReactNode[] =>
    typeof part !== "string"
      ? [part]
      : part.split(/([^\s()<>,;]+@[^\s()<>,;]+\.[a-z]{2,})/i).map((piece, j) =>
          j % 2 === 1 ? (
            <a key={`${i}-${j}`} href={`mailto:${piece}`} className="text-ink font-medium underline underline-offset-2">{piece}</a>
          ) : (
            <Fragment key={`${i}-${j}`}>{piece}</Fragment>
          ),
        ),
  );
}

export function LegalBody({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  return (
    <div className="text-ink flex flex-col gap-4 text-base leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length === 0) return null;
        const out: ReactNode[] = [];
        let bullets: string[] = [];
        let para: string[] = [];
        const flush = () => {
          if (para.length) {
            out.push(<p key={`p${out.length}`}>{inline(para.join(" "))}</p>);
            para = [];
          }
          if (bullets.length) {
            out.push(
              <ul key={`u${out.length}`} className="flex list-disc flex-col gap-1.5 pl-6">
                {bullets.map((b, j) => <li key={j}>{inline(b)}</li>)}
              </ul>,
            );
            bullets = [];
          }
        };
        for (const line of lines) {
          const t = line.trim();
          if (t.startsWith("## ")) {
            flush();
            out.push(
              <h2 key={`h${out.length}`} className="font-display text-ink mt-4 text-xl font-semibold">
                {t.slice(3)}
              </h2>,
            );
          } else if (t.startsWith("- ")) {
            if (para.length) flush();
            bullets.push(t.slice(2));
          } else {
            if (bullets.length) flush();
            para.push(t);
          }
        }
        flush();
        return <Fragment key={i}>{out}</Fragment>;
      })}
    </div>
  );
}
