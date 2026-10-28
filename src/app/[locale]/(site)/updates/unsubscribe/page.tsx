import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { isValidOptOut } from "@/lib/updates/server";
import { unsubscribeFromUpdates } from "@/lib/updates/actions";

export async function generateMetadata() {
  const t = await getTranslations("updateMails");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * The opt-out link at the bottom of every update mail
 * (optOutUrl() in src/lib/updates/server.ts). A button rather than
 * opting out on page load, so mail scanners opening the link don't
 * unsubscribe anyone.
 */
export default async function UpdatesUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; s?: string; done?: string }>;
}) {
  const { e = "", s = "", done } = await searchParams;
  const t = await getTranslations("updateMails");
  const locale = await getLocale();
  const email = e.toLowerCase();
  const valid = isValidOptOut(email, s);

  return (
    <Container panel className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="font-display text-ink text-2xl font-bold">
          {!valid ? t("invalidTitle") : done ? t("doneTitle") : t("title")}
        </h1>
        <p className="text-ink/70">
          {!valid
            ? t("invalidBody")
            : done
              ? t("doneBody", { email })
              : t("body", { email })}
        </p>
        {valid && !done && (
          <form action={unsubscribeFromUpdates}>
            <input type="hidden" name="e" value={email} />
            <input type="hidden" name="s" value={s} />
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              {t("button")}
            </button>
          </form>
        )}
      </div>
    </Container>
  );
}
