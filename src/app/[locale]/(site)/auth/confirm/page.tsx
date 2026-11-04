import { getTranslations } from "next-intl/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Container } from "@/components/ui/Container";
import { ConfirmEmailLink } from "@/components/auth/ConfirmEmailLink";
import { Link } from "@/i18n/navigation";

const TYPES: EmailOtpType[] = ["signup", "recovery", "email", "magiclink", "invite", "email_change"];

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("confirmTitle"), robots: { index: false, follow: false } };
}

/**
 * Landing page for the links in Supabase's auth mails (signup, password
 * reset, sign-in), reached via /api/auth/callback with ?token_hash=&type=.
 * Opening it changes nothing; the button spends the token (see
 * ConfirmEmailLink). Mail templates: SETUP.md.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const t = await getTranslations("auth");
  const { token_hash, type, next } = await searchParams;
  const otpType = TYPES.find((x) => x === type);
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : otpType === "recovery"
        ? "/auth/reset-password"
        : "/account";

  return (
    <Container panel className="flex flex-col gap-8 py-16 sm:py-24">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6 text-center">
        <h1 className="font-display text-ink text-2xl font-bold">
          {otpType === "recovery" ? t("confirmTitleReset") : t("confirmTitle")}
        </h1>
        {token_hash && otpType ? (
          <>
            <p className="text-ink/70 text-sm">
              {otpType === "recovery" ? t("confirmBodyReset") : t("confirmBody")}
            </p>
            <ConfirmEmailLink tokenHash={token_hash} type={otpType} next={safeNext} />
          </>
        ) : (
          <p className="border-line bg-mist rounded-2xl border p-4 text-sm">
            {t("linkExpiredShort")}{" "}
            <Link href="/auth/sign-in" className="font-semibold underline underline-offset-2">
              {t("backToSignIn")}
            </Link>
          </p>
        )}
      </div>
    </Container>
  );
}
