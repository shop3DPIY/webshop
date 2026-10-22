import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { BackendNotConnected } from "@/components/system/BackendNotConnected";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signUpTitle"), robots: { index: false, follow: false } };
}

export default async function SignUpPage() {
  const t = await getTranslations("auth");

  return (
    <Container panel className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-ink text-center text-2xl font-bold">
          {t("signUpTitle")}
        </h1>

        <div className="mt-8">
          {isSupabaseConfigured() ? <SignUpForm /> : <BackendNotConnected />}
        </div>

        <p className="text-ink/60 mt-6 text-center text-sm">
          {t("haveAccount")}{" "}
          <Link href="/auth/sign-in" className="text-ink font-semibold underline underline-offset-2">
            {t("signInLink")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
