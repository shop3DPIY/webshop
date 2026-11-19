import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/components/auth/SignInForm";
import { BackendNotConnected } from "@/components/system/BackendNotConnected";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signInTitle"), robots: { index: false, follow: false } };
}

/** A narrow frosted-glass card, centred. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirmed?: string }>;
}) {
  const t = await getTranslations("auth");
  const { next, confirmed } = await searchParams;

  return (
    <section className="flex min-h-[calc(100svh-5rem)] items-center justify-center px-4 py-10">
      <div className="glass w-full max-w-[440px] rounded-3xl p-6 sm:p-10">
        <h1 className="font-display text-ink text-center text-2xl font-bold">
          {t("signInTitle")}
        </h1>
        <p className="text-ink mt-2 text-center text-sm">{t("welcomeBack")}</p>

        {confirmed && (
          <p role="status" className="border-line bg-mist mt-6 rounded-2xl border p-4 text-center text-sm">
            {t("emailConfirmed")}
          </p>
        )}

        <div className="mt-8">
          {isSupabaseConfigured() ? (
            <SignInForm redirectTo={next ?? "/account"} />
          ) : (
            <BackendNotConnected />
          )}
        </div>

        <p className="border-line text-ink mt-8 border-t pt-6 text-center text-sm">
          {t("noAccount")}{" "}
          <Link href="/auth/sign-up" className="text-ink font-semibold underline underline-offset-2">
            {t("signUpLink")}
          </Link>
        </p>
      </div>
    </section>
  );
}
