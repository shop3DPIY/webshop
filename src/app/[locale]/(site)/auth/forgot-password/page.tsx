import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { BackendNotConnected } from "@/components/system/BackendNotConnected";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("forgotTitle"), robots: { index: false, follow: false } };
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const t = await getTranslations("auth");
  const { expired } = await searchParams;

  return (
    <Container panel className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-ink text-center text-2xl font-bold">
          {t("forgotTitle")}
        </h1>

        {expired && (
          <p className="border-line bg-mist mt-6 rounded-2xl border p-4 text-center text-sm">
            {t("linkExpired")}
          </p>
        )}

        <div className="mt-8">
          {isSupabaseConfigured() ? <ForgotPasswordForm /> : <BackendNotConnected />}
        </div>

        <p className="text-ink/60 mt-6 text-center text-sm">
          <Link href="/auth/sign-in" className="text-ink font-semibold underline underline-offset-2">
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
