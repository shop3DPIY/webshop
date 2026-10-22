import type { ReactNode } from "react";

const BASE = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/**
 * `panel` puts the content on a white glass tile — the same treatment as
 * the hero panels — so no text ever sits directly on the backdrop. The
 * section's vertical rhythm (py-, pt- and pb- classes) stays on the
 * outer wrapper; everything else (flex/grid/gap/...) moves onto the panel.
 */
export function Container({
  children,
  className = "",
  panel = false,
}: {
  children: ReactNode;
  className?: string;
  panel?: boolean;
}) {
  if (!panel) {
    return <div className={`${BASE} ${className}`}>{children}</div>;
  }

  const tokens = className.split(/\s+/).filter(Boolean);
  const isSpacing = (t: string) => /^(?:[a-z]+:)?p[tby]-/.test(t);
  const outer = tokens.filter(isSpacing).join(" ");
  const inner = tokens.filter((t) => !isSpacing(t)).join(" ");

  return (
    <div className={`${BASE} ${outer || "py-8 sm:py-12"}`}>
      <div className={`glass rounded-3xl p-6 sm:p-10 ${inner}`}>{children}</div>
    </div>
  );
}
