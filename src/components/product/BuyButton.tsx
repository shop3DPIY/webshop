"use client";

import { useState } from "react";

/**
 * "Buy now": a plain link to /api/checkout/… (a route handler that creates
 * the Polar checkout and redirects). Not the i18n <Link> — that first
 * tries a client-side RSC fetch of an API route, fails, and only then
 * navigates, which made the button feel dead for seconds. Shows a
 * spinner + "One moment…" while Polar's page loads.
 */
export function BuyButton({
  href,
  label,
  loadingLabel,
  productSlug,
}: {
  href: string;
  label: string;
  loadingLabel: string;
  productSlug: string;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <a
      href={href}
      onClick={() => setLoading(true)}
      aria-busy={loading}
      data-umami-event="buy-click"
      data-umami-event-product={productSlug}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-action bg-action px-7 py-3.5 text-base font-semibold text-on-action backdrop-blur-lg transition-colors hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover ${loading ? "pointer-events-none opacity-80" : ""}`}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {loading ? loadingLabel : label}
    </a>
  );
}
