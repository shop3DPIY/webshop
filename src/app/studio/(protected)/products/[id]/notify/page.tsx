import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isMailConfigured } from "@/lib/mail/send";
import { getUpdateRecipients } from "@/lib/updates/server";
import { notifyBuyers } from "@/lib/updates/actions";

/**
 * Tell everyone who owns a design that a new version is out. Studio sends
 * you here after saving a product with a new version number (and the
 * edit page links here), but nothing is mailed until you click Send.
 */
export default async function NotifyBuyersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { id } = await params;
  const { sent, error } = await searchParams;
  const supabase = await createClient();
  const { data: product } = await supabase!
    .from("products")
    .select("id, title, version, update_notified_version")
    .eq("id", id)
    .single();
  if (!product) notFound();

  const recipients = await getUpdateRecipients(id);
  const alreadySent = product.update_notified_version === product.version;
  const mailReady = isMailConfigured();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Notify buyers</h1>
        <p className="text-ink/60 mt-1 text-sm">
          {product.title} · v{product.version}
        </p>
      </div>

      {sent && (
        <p className="rounded-2xl p-4 text-sm font-medium glass">
          Update mail sent to {sent} buyer(s).
        </p>
      )}
      {error && (
        <p className="rounded-2xl bg-amber-100 p-4 text-sm font-medium text-amber-900">
          Couldn&apos;t send: {error}
        </p>
      )}

      <div className="flex flex-col gap-4 rounded-3xl p-6 text-sm glass">
        <p>
          <strong>{recipients.length}</strong> buyer(s) own this design and
          get update mails (people who opted out are left out).
        </p>
        <p className="text-ink/60">
          {product.update_notified_version
            ? `Last update mail: v${product.update_notified_version}.`
            : "No update mail sent for this design yet."}
          {alreadySent && " Buyers already got a mail about this version."}
        </p>

        {!mailReady ? (
          <p className="rounded-2xl bg-amber-100 p-4 font-medium text-amber-900">
            Mail is not set up (RESEND_API_KEY / MAIL_FROM).
          </p>
        ) : recipients.length > 0 ? (
          <form action={notifyBuyers} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={product.id} />
            <label className="flex flex-col gap-1.5 font-medium">
              What&apos;s new (optional, shown in the mail)
              <textarea
                name="note"
                rows={4}
                maxLength={2000}
                placeholder="e.g. Stronger hinge, plus a 3MF with supports"
                className="border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm font-normal"
              />
            </label>
            <button
              type="submit"
              className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover self-start rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              {alreadySent ? "Send again" : `Send to ${recipients.length} buyer(s)`}
            </button>
          </form>
        ) : null}
      </div>

      <Link href="/studio/products" className="text-sm underline">
        Back to products
      </Link>
    </div>
  );
}
