import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SignInForm } from "@/components/auth/SignInForm";
import { BackendNotConnected } from "@/components/system/BackendNotConnected";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signInTitle"), robots: { index: false, follow: false } };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const t = await getTranslations("auth");
  const { next } = await searchParams;

  return (
    <Container panel className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-ink text-center text-2xl font-bold">
          {t("signInTitle")}
        </h1>

        <div className="mt-8">
          {isSupabaseConfigured() ? (
            <SignInForm redirectTo={next ?? "/account"} />
          ) : (
            <BackendNotConnected />
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Link href="/auth/forgot-password" className="text-ink font-semibold underline underline-offset-2">
            {t("forgotLink")}
          </Link>
          <p className="text-ink/60">
            {t("noAccount")}{" "}
            <Link href="/auth/sign-up" className="text-ink font-semibold underline underline-offset-2">
              {t("signUpLink")}
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
