import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { COLLECTION_LIST } from "@/lib/config/colors";
import { getSubscriberByToken } from "@/lib/newsletter/server";
import {
  resubscribeToNewsletter,
  unsubscribeFromNewsletter,
  updateNewsletterPreferences,
} from "@/lib/newsletter/actions";

export async function generateMetadata() {
  const t = await getTranslations("newsletter");
  return { title: t("manageTitle"), robots: { index: false, follow: false } };
}

/**
 * The personal link at the bottom of every newsletter
 * (manageUrl() in src/lib/newsletter/server.ts): pick categories or
 * unsubscribe, no login needed — the token in the URL is the key.
 */
export default async function ManageNewsletterPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { token } = await params;
  const { s } = await searchParams;
  const t = await getTranslations("newsletter");
  const tCollections = await getTranslations("collections.items");
  const locale = await getLocale();
  const subscriber = await getSubscriberByToken(token);

  const notice =
    s === "saved"
      ? t("saved")
      : s === "none"
        ? t("none")
        : s === "resubscribed"
          ? t("resubscribed")
          : null;

  return (
    <Container panel className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        {!subscriber ? (
          <>
            <h1 className="font-display text-ink text-2xl font-bold">
              {t("notFoundTitle")}
            </h1>
            <p className="text-ink/70">{t("notFoundBody")}</p>
          </>
        ) : subscriber.status === "unsubscribed" ? (
          <>
            <h1 className="font-display text-ink text-2xl font-bold">
              {t("unsubscribedTitle")}
            </h1>
            <p className="text-ink/70">{t("unsubscribedBody")}</p>
            <form action={resubscribeToNewsletter}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit">{t("resubscribe")}</Button>
            </form>
          </>
        ) : (
          <>
            <div>
              <h1 className="font-display text-ink text-2xl font-bold">
                {t("manageTitle")}
              </h1>
              <p className="text-ink/70 mt-2">
                {t("manageIntro", { email: subscriber.email })}
              </p>
            </div>

            {notice && (
              <p className="border-line bg-mist rounded-2xl border p-4 text-sm">
                {notice}
              </p>
            )}

            <form
              action={updateNewsletterPreferences}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="locale" value={locale} />
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="radio"
                  name="mode"
                  value="all"
                  defaultChecked={subscriber.all_categories}
                />
                {t("modeAll")}
              </label>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="radio"
                  name="mode"
                  value="some"
                  defaultChecked={!subscriber.all_categories}
                />
                {t("modeSome")}
              </label>
              <div className="grid grid-cols-1 gap-2 pl-8 sm:grid-cols-2">
                {COLLECTION_LIST.map((c) => (
                  <label
                    key={c.slug}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm glass"
                    style={{ borderColor: c.color }}
                  >
                    <input
                      type="checkbox"
                      name="categories"
                      value={c.slug}
                      defaultChecked={subscriber.categories.includes(c.slug)}
                    />
                    {tCollections(`${c.slug}.name`)}
                  </label>
                ))}
              </div>
              <Button type="submit" className="mt-2 w-fit">
                {t("save")}
              </Button>
            </form>

            <form
              action={unsubscribeFromNewsletter}
              className="border-line border-t pt-6"
            >
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="secondary">
                {t("unsubscribe")}
              </Button>
            </form>
          </>
        )}
      </div>
    </Container>
  );
}
