import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { getSubscriberByEmail } from "@/lib/newsletter/server";
import { subscribeFromAccount } from "@/lib/newsletter/actions";

/** Account page block: subscribed → link to preferences; not yet → one-click sign up. */
export async function AccountNewsletter({ email }: { email: string }) {
  const t = await getTranslations("newsletter");
  const locale = await getLocale();
  const subscriber = email ? await getSubscriberByEmail(email) : null;
  const subscribed = subscriber?.status === "subscribed";

  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl p-6 glass sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-display text-ink text-lg font-semibold">{t("accountTitle")}</h3>
        <p className="text-ink/70 mt-1 text-sm">
          {subscribed ? t("accountSubscribed", { email }) : t("accountNotSubscribed")}
        </p>
      </div>
      {subscribed ? (
        <Button href={`/newsletter/${subscriber.token}`} variant="secondary" className="shrink-0">
          {t("accountManage")}
        </Button>
      ) : (
        <form action={subscribeFromAccount}>
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" className="shrink-0">
            {t("accountSubscribe")}
          </Button>
        </form>
      )}
    </div>
  );
}
