import Link from "next/link";
import { COLLECTION_LIST } from "@/lib/config/colors";
import { isMailConfigured } from "@/lib/mail/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewsletter } from "@/lib/newsletter/admin-actions";

const FIELD =
  "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

const ERRORS: Record<string, string> = {
  "not-configured":
    "Mail isn't set up yet — add RESEND_API_KEY and MAIL_FROM (see SETUP.md, section Mail).",
  empty: "Fill in a subject and a message.",
  "no-categories": "Pick at least one category, or choose “Everyone”.",
  confirm: "Tick the confirmation box to send to subscribers.",
  "no-recipients": "Nobody is subscribed to those categories yet.",
  failed: "Sending failed — check the Resend dashboard for details.",
};

export default async function SendNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; test?: string }>;
}) {
  const { error, sent, test } = await searchParams;
  const admin = createAdminClient();
  const { count } = admin
    ? await admin
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("status", "subscribed")
    : { count: 0 };
  const configured = isMailConfigured();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/studio/newsletter"
          className="text-ink/60 hover:text-ink text-sm"
        >
          ← Newsletter
        </Link>
        <h1 className="font-display mt-2 text-2xl font-bold">
          Send a newsletter
        </h1>
        <p className="text-ink/60 mt-1 text-sm">
          {count ?? 0} subscribed. Every mail gets the subscriber&apos;s own
          “change preferences or unsubscribe” link at the bottom. Send a test to
          yourself first. Resend&apos;s free plan has a daily sending limit —
          check it in your Resend dashboard.
        </p>
      </div>

      {!configured && (
        <p className="rounded-2xl border border-amber-300 bg-amber-300/20 p-4 text-sm">
          {ERRORS["not-configured"]}
        </p>
      )}
      {error && error !== "not-configured" && (
        <p className="rounded-2xl border border-red-400 bg-red-400/15 p-4 text-sm">
          {ERRORS[error] ?? "Something went wrong."}
          {sent &&
            Number(sent) > 0 &&
            ` (${sent} were already sent before it stopped.)`}
        </p>
      )}
      {test && (
        <p className="rounded-2xl p-4 text-sm glass">
          Test mail sent to you — check your inbox.
        </p>
      )}
      {sent && !error && (
        <p className="rounded-2xl p-4 text-sm font-medium glass">
          Sent to {sent} subscriber(s). 🎉
        </p>
      )}

      <form action={sendNewsletter} className="flex flex-col gap-5">
        <label className={LABEL}>
          Subject
          <input
            type="text"
            name="subject"
            required
            maxLength={200}
            className={FIELD}
          />
        </label>
        <label className={LABEL}>
          Message (plain text — a blank line starts a new paragraph)
          <textarea name="message" required rows={12} className={FIELD} />
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Send to</legend>
          <label className="flex items-center gap-3 text-sm">
            <input type="radio" name="audience" value="all" defaultChecked />
            Everyone who&apos;s subscribed
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="radio" name="audience" value="some" />
            Only subscribers of these categories (plus everyone on “all
            categories”):
          </label>
          <div className="grid grid-cols-1 gap-2 pl-8 sm:grid-cols-2">
            {COLLECTION_LIST.map((c) => (
              <label
                key={c.slug}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm glass"
              >
                <input type="checkbox" name="categories" value={c.slug} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            name="intent"
            value="test"
            className="border-line bg-mist hover:border-brand-purple hover:bg-brand-purple/45 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Send test to me
          </button>
        </div>

        <div className="border-line flex flex-col gap-3 border-t pt-5">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input type="checkbox" name="confirm" />
            I&apos;ve checked the test mail — send this to the subscribers
          </label>
          <button
            type="submit"
            name="intent"
            value="send"
            className="border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover w-fit rounded-full border px-6 py-3 text-sm font-semibold backdrop-blur-lg transition-colors"
          >
            Send newsletter
          </button>
        </div>
      </form>
    </div>
  );
}
