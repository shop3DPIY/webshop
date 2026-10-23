import { createAdminClient } from "@/lib/supabase/admin";
import { COLLECTIONS, type CollectionSlug } from "@/lib/config/colors";

/**
 * Newsletter subscribers. Sending happens outside the site for now (no
 * mail service yet): export the list as CSV — every row includes the
 * personal manage/unsubscribe link that must go at the bottom of each mail.
 */
export default async function StudioNewsletterPage() {
  const admin = createAdminClient();
  const { data: rows } = admin
    ? await admin
        .from("newsletter_subscribers")
        .select("id, email, status, all_categories, categories, locale, source, created_at")
        .order("created_at", { ascending: false })
    : { data: [] };
  const subscribers = rows ?? [];
  const active = subscribers.filter((r) => r.status === "subscribed");

  const categoryNames = (r: { all_categories: boolean; categories: string[] }) =>
    r.all_categories
      ? "All categories"
      : r.categories.map((slug) => COLLECTIONS[slug as CollectionSlug]?.name ?? slug).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Newsletter</h1>
          <p className="text-ink/60 mt-1 max-w-2xl text-sm">
            {active.length} subscribed · {subscribers.length - active.length} unsubscribed. Sending
            isn&apos;t connected yet (no mail service): export the list, and put each subscriber&apos;s
            manage link (in the CSV) at the bottom of every mail — that&apos;s where they change
            categories or unsubscribe.
          </p>
        </div>
        <a
          href="/studio/newsletter-export"
          className="border-line bg-mist hover:border-brand-purple hover:bg-brand-purple/45 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Export CSV
        </a>
      </div>

      <div className="divide-line divide-y rounded-3xl glass">
        {subscribers.length === 0 && (
          <p className="text-ink/60 p-8 text-center text-sm">No subscribers yet.</p>
        )}
        {subscribers.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
            <div>
              <p className="font-medium">{r.email}</p>
              <p className="text-ink/60 text-xs">
                {categoryNames(r)} · {r.locale.toUpperCase()} · via {r.source} ·{" "}
                {new Date(r.created_at).toLocaleDateString("nl-NL")}
              </p>
            </div>
            <span className="border-line rounded-full border px-3 py-1 text-xs capitalize">
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
