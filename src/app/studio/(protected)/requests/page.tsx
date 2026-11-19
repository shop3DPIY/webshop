import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmSubmitButton, STUDIO_CONFIRM } from "@/components/ui/ConfirmDialog";
import { deleteRequest, setRequestStatus } from "@/lib/requests/admin-actions";

const TABS = [
  { key: "new", label: "New", statuses: ["new"] },
  { key: "public", label: "On the wish list", statuses: ["open", "planned"] },
  { key: "done", label: "Done", statuses: ["done"] },
  { key: "declined", label: "Declined", statuses: ["declined"] },
] as const;

const STATUS_OPTIONS = [
  { value: "new", label: "New (not public)" },
  { value: "open", label: "Wish list — open for votes" },
  { value: "planned", label: "Wish list — planned" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined (hidden)" },
];

/**
 * Model requests and problem reports from /requests. Requests moved to
 * the wish list show publicly with a vote button; problem reports are
 * never public (set them to Done or Declined when handled).
 */
export default async function StudioRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab = TABS.find((t) => t.key === tabParam) ?? TABS[0];
  const admin = createAdminClient();

  const { data: all } = await admin!
    .from("model_requests")
    .select(
      "id, kind, title, details, name, email, status, created_at, products(title, slug), model_request_votes(user_id)",
    )
    .order("created_at", { ascending: false });
  const rows = (all ?? []).map((r) => ({
    ...r,
    product: (Array.isArray(r.products) ? r.products[0] : r.products) as
      | { title: string; slug: string }
      | null,
    votes: (r.model_request_votes ?? []).length,
  }));
  const count = (statuses: readonly string[]) =>
    rows.filter((r) => statuses.includes(r.status)).length;
  const shown = rows
    .filter((r) => (tab.statuses as readonly string[]).includes(r.status))
    .sort((a, b) => (tab.key === "public" ? b.votes - a.votes : 0));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Requests</h1>
        <a
          href="/requests"
          target="_blank"
          className="border-line hover:bg-mist rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          View wish list ↗
        </a>
      </div>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/studio/requests?tab=${t.key}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              t.key === tab.key
                ? "border-brand-purple bg-brand-purple/45"
                : "border-line hover:bg-mist"
            }`}
          >
            {t.label} ({count(t.statuses)})
          </Link>
        ))}
      </nav>

      <div className="divide-line divide-y rounded-3xl glass">
        {shown.length === 0 ? (
          <p className="text-ink/60 p-8 text-center text-sm">Nothing here.</p>
        ) : (
          shown.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 p-5 text-sm lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      r.kind === "problem"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-white text-night"
                    }`}
                  >
                    {r.kind === "problem" ? "Problem" : "Request"}
                  </span>
                  {r.title}
                  {r.kind === "request" && r.status !== "new" && (
                    <span className="text-ink/60 font-normal">· 👍 {r.votes}</span>
                  )}
                </p>
                {r.product && (
                  <p className="text-ink/70 mt-1">
                    About:{" "}
                    <a href={`/product/${r.product.slug}`} target="_blank" className="underline">
                      {r.product.title}
                    </a>
                  </p>
                )}
                {r.details && <p className="text-ink/80 mt-1 whitespace-pre-line">{r.details}</p>}
                <p className="text-ink/60 mt-1">
                  {r.name} ·{" "}
                  <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.title}`)}`} className="underline">
                    {r.email}
                  </a>{" "}
                  ·{" "}
                  {new Date(r.created_at).toLocaleString("nl-NL", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <form action={setRequestStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="tab" value={tab.key} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    className="border-line bg-paper rounded-2xl border px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.filter(
                      // Problems never go on the public wish list.
                      (o) => r.kind === "request" || !["open", "planned"].includes(o.value),
                    ).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="border-line bg-mist hover:bg-paper rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                  >
                    Save
                  </button>
                </form>
                <form action={deleteRequest}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="tab" value={tab.key} />
                  <ConfirmSubmitButton
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/70 hover:text-white"
                    labels={{
                      title: `Delete “${r.title}”?`,
                      body: "The request and its votes are deleted. This can't be undone.",
                      ...STUDIO_CONFIRM,
                    }}
                  >
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
