import { Link } from "@/i18n/navigation";

/**
 * "Shop › Doll & Mini › Small Doll Stand" — the last item is the current
 * page (not a link). Also gives Google a BreadcrumbList.
 */
export function Breadcrumbs({
  items,
  locale,
}: {
  items: { label: string; href?: string }[];
  locale: string;
}) {
  const base = `https://3dpiy.com${locale === "nl" ? "/nl" : ""}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href && { item: `${base}${item.href}` }),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className="text-ink flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-brand-purple font-medium underline-offset-2 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
