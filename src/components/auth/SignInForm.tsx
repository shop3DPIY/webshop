"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const FIELD = "border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal";

/**
 * One sign-in form for everyone — customers and the admin alike — with two
 * ways in: email + password, or a one-time code sent by email (Supabase
 * OTP; only for existing accounts, sign-up stays on its own page). After a
 * successful sign-in we check the profile's role: admins always land in
 * 3DPIY Studio (outside the [locale] tree, so a plain location change, not
 * the i18n-aware router), everyone else goes to `redirectTo` (defaults to
 * "/account"). There is no separate admin sign-in screen.
 *
 * The mail uses Supabase's "Magic Link" template. Its default sends a
 * sign-in link (handled by /api/auth/callback); once custom SMTP is set up
 * the template can include {{ .Token }} so the mail shows a code to type in
 * here instead (see SETUP.md). Both paths work.
 */
export function SignInForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [method, setMethod] = useState<"password" | "code">("password");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const fail = (message: string) => {
    setErrorMessage(message);
    setStatus("error");
  };

  async function afterSignIn(userId: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role === "admin") {
      // Hard navigation on purpose: /studio is a separate root layout
      // (src/app/studio/layout.tsx), outside this page's NextIntlClientProvider
      // tree — a client-side router.push() can't soft-navigate across roots.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/studio";
      return;
    }

    // /studio lives outside the [locale] tree and is only ever valid for
    // admins (guard.ts sends non-admin/not-logged-in visitors here with
    // ?next=/studio) — a non-admin landing here with that value falls back
    // to their own account instead of being pushed at a route meant for
    // Studio via the locale-aware router.
    router.push(redirectTo.startsWith("/studio") ? "/account" : redirectTo);
    router.refresh();
  }

  async function signInWithPassword(data: FormData) {
    const supabase = createClient();
    if (!supabase) return;
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    if (error) return fail(error.message);
    await afterSignIn(signInData.user.id);
  }

  async function sendCode(email: string) {
    const supabase = createClient();
    if (!supabase) return;
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        // Supabase's default template (until custom SMTP lets us edit it)
        // mails a link instead of a code — make that link land signed in.
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(
          redirectTo.startsWith("/studio") ? "/account" : redirectTo,
        )}`,
      },
    });
    if (error) return fail(error.message);
    setCodeSentTo(email);
    setStatus("idle");
  }

  async function verifyCode(token: string) {
    const supabase = createClient();
    if (!supabase || !codeSentTo) return;
    const { data, error } = await supabase.auth.verifyOtp({
      email: codeSentTo,
      token: token.replace(/\s/g, ""),
      type: "email",
    });
    if (error || !data.user) return fail(error?.message ?? t("errorGeneric"));
    await afterSignIn(data.user.id);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("loading");
    if (method === "password") return signInWithPassword(data);
    if (!codeSentTo) return sendCode(String(data.get("email") ?? ""));
    return verifyCode(String(data.get("code") ?? ""));
  }

  const switchMethod = () => {
    setMethod((m) => (m === "password" ? "code" : "password"));
    setCodeSentTo(null);
    setStatus("idle");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {codeSentTo ? (
        <>
          <p className="text-ink/80 text-sm">{t("codeSent", { email: codeSentTo })}</p>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t("codeLabel")}
            <input
              type="text"
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,10}"
              autoFocus
              className={`${FIELD} text-center tracking-[0.4em]`}
            />
          </label>
        </>
      ) : (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("emailLabel")}
          <input type="email" name="email" required autoComplete="email" className={FIELD} />
        </label>
      )}

      {method === "password" && (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("passwordLabel")}
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className={FIELD}
          />
        </label>
      )}

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" size="lg" disabled={status === "loading"} className="mt-2">
        {method === "code" && !codeSentTo ? t("sendCode") : t("signInSubmit")}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm">
        {codeSentTo && (
          <button
            type="button"
            onClick={() => sendCode(codeSentTo)}
            disabled={status === "loading"}
            className="text-ink font-semibold underline underline-offset-2"
          >
            {t("resendCode")}
          </button>
        )}
        <button
          type="button"
          onClick={switchMethod}
          className="text-ink font-semibold underline underline-offset-2"
        >
          {method === "password" ? t("useCode") : t("usePassword")}
        </button>
      </div>
    </form>
  );
}
