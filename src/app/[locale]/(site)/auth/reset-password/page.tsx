import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { BackendNotConnected } from "@/components/system/BackendNotConnected";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("resetTitle"), robots: { index: false, follow: false } };
}

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <Container className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="font-display text-brand-pink text-center text-2xl font-bold">
          {t("resetTitle")}
        </h1>

        <div className="mt-8">
          {isSupabaseConfigured() ? <ResetPasswordForm /> : <BackendNotConnected />}
        </div>
      </div>
    </Container>
  );
}
