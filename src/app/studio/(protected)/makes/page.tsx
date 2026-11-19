import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmSubmitButton, STUDIO_CONFIRM } from "@/components/ui/ConfirmDialog";
import { approveMake, deleteMake } from "@/lib/makes/admin-actions";
import { makeImageUrl } from "@/lib/makes/server";

/**
 * Photos buyers shared of their print (product page → "Share your
 * print"). Approve to show them on the product page; Delete removes the
 * row and the photo for good.
 */
export default async function StudioMakesPage() {
  const admin = createAdminClient();
  const { data } = await admin!
    .from("customer_makes")
    .select("id, status, display_name, caption, image_path, created_at, products(title, slug), profiles(email)")
    .order("created_at", { ascending: false });
  const first = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);
  const rows = (data ?? []).map((m) => ({
    ...m,
    product: first(m.products) as { title: string; slug: string } | null,
    email: (first(m.profiles) as { email: string } | null)?.email ?? "",
    url: makeImageUrl(m.image_path),
  }));
  const pending = rows.filter((m) => m.status === "pending");
  const approved = rows.filter((m) => m.status === "approved");

  const card = (m: (typeof rows)[number]) => (
    <div key={m.id} className="flex flex-col gap-3 rounded-3xl p-3 glass">
      <a href={m.url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.url} alt="" className="aspect-square w-full rounded-2xl object-cover" />
      </a>
      <div className="flex flex-col gap-1 px-1 text-sm">
        {m.product && (
          <a href={`/product/${m.product.slug}`} target="_blank" className="font-semibold underline">
            {m.product.title}
          </a>
        )}
        {m.caption && <p>{m.caption}</p>}
        <p className="text-ink/60 text-xs">
          {m.display_name || "(no name)"} · {m.email} ·{" "}
          {new Date(m.created_at).toLocaleDateString("nl-NL", { dateStyle: "medium" })}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 px-1 pb-1">
        {m.status === "pending" && (
          <form action={approveMake}>
            <input type="hidden" name="id" value={m.id} />
            <button
              type="submit"
              className="border-action bg-action text-on-action hover:bg-action-hover rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            >
              Approve
            </button>
          </form>
        )}
        <form action={deleteMake}>
          <input type="hidden" name="id" value={m.id} />
          <ConfirmSubmitButton
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/70 hover:text-white"
            labels={{
              title: m.status === "pending" ? "Reject and delete this photo?" : "Remove this photo from the site?",
              body: "The photo is deleted for good. This can't be undone.",
              ...STUDIO_CONFIRM,
            }}
          >
            {m.status === "pending" ? "Reject" : "Delete"}
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-2xl font-bold">Customer makes</h1>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Waiting for review ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-ink/60 text-sm">Nothing to review.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{pending.map(card)}</div>
        )}
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">On the site ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-ink/60 text-sm">No approved photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{approved.map(card)}</div>
        )}
      </section>
    </div>
  );
}
