"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

// 16px text: smaller makes iOS Safari zoom in when the field is tapped.
const FIELD =
  "border-line bg-paper text-ink w-full rounded-2xl border px-4 py-3 text-base font-normal";

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
export function SignInForm({
  redirectTo = "/account",
}: {
  redirectTo?: string;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [method, setMethod] = useState<"password" | "code">("password");
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  // Bumped on "Send a new code": empties the code field (remount) and
  // shows a "new code sent" note, so the old code isn't tried again.
  const [codeRound, setCodeRound] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  // A field the browser flags (empty, not an email) — shown under it.
  const [fieldError, setFieldError] = useState<{ name: string; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
    if (error)
      return fail(
        error.code === "invalid_credentials"
          ? t("wrongPassword")
          : t("errorGeneric"),
      );
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
    // shouldCreateUser is off, so an unknown address comes back as
    // "Signups not allowed for otp" — say what it means instead.
    if (error)
      return fail(
        error.code === "otp_disabled" ||
          /signups not allowed/i.test(error.message)
          ? t("noAccountForEmail")
          : t("errorGeneric"),
      );
    if (codeSentTo) setCodeRound((n) => n + 1);
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
    // Supabase's message is English and technical; say what to do instead.
    if (error || !data.user)
      return fail(error ? t("codeInvalid") : t("errorGeneric"));
    await afterSignIn(data.user.id);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;
    // The browser's own checks (required, email, code pattern), shown
    // under the field instead of as a native bubble.
    const invalid = [...event.currentTarget.elements].find(
      (el): el is HTMLInputElement => el instanceof HTMLInputElement && !el.checkValidity(),
    );
    if (invalid) {
      setFieldError({
        name: invalid.name,
        message:
          invalid.name === "email" && invalid.value ? t("invalidEmail")
          : invalid.name === "code" && invalid.value ? t("codeInvalid")
          : t("fieldRequired"),
      });
      invalid.focus();
      return;
    }
    setFieldError(null);
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
    setFieldError(null);
  };

  /** aria wiring for a field that may show an error under it. */
  const errorProps = (name: string) =>
    fieldError?.name === name
      ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` }
      : {};
  const errorText = (name: string) =>
    fieldError?.name === name && (
      <span id={`${name}-error`} className="pl-4 text-sm font-semibold text-red-100">
        {fieldError.message}
      </span>
    );

  const loading = status === "loading";

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      // Typing in the field that had an error clears that error.
      onChange={(e) => {
        if (fieldError && (e.target as unknown as HTMLInputElement).name === fieldError.name) setFieldError(null);
      }}
      noValidate
      aria-busy={loading}
      className="flex flex-col gap-5"
    >
      {status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-400/50 dark:bg-red-950/60 dark:text-red-100"
        >
          <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 7v6M12 17h.01" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {codeSentTo ? (
        <>
          <p className="text-ink text-sm">
            {t("codeSent", { email: codeSentTo })}
          </p>
          {codeRound > 0 && status !== "error" && (
            <p role="status" className="border-line bg-mist rounded-2xl border p-3 text-sm font-medium">
              {t("codeResent")}
            </p>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {t("codeLabel")}
            <input
              key={codeRound}
              type="text"
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,10}"
              autoFocus
              {...errorProps("code")}
              className={`${FIELD} text-center tracking-[0.4em]`}
            />
            {errorText("code")}
          </label>
        </>
      ) : (
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t("emailLabel")}
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            {...errorProps("email")}
            className={FIELD}
          />
          {errorText("email")}
        </label>
      )}

      {method === "password" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="pl-4 text-sm font-semibold">
              {t("passwordLabel")}
            </label>
            <Link href="/auth/forgot-password" className="text-ink text-sm font-semibold underline underline-offset-2">
              {t("forgotLink")}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              required
              autoComplete="current-password"
              {...errorProps("password")}
              className={`${FIELD} pr-14`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              aria-pressed={showPassword}
              className="text-ink/80 hover:text-ink absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full"
            >
              <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword && <path d="M3 3l18 18" />}
              </svg>
            </button>
          </div>
          {errorText("password")}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="mt-1 w-full"
      >
        <span className="flex items-center gap-2">
          {loading && (
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" className="animate-spin">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {loading
            ? t("busy")
            : method === "code" && !codeSentTo
              ? t("sendCode")
              : t("signInSubmit")}
        </span>
      </Button>

      {codeSentTo && (
        <button
          type="button"
          onClick={() => sendCode(codeSentTo)}
          disabled={loading}
          className="text-ink mx-auto text-sm font-semibold underline underline-offset-2"
        >
          {t("resendCode")}
        </button>
      )}

      <div className="text-ink flex items-center gap-3 text-xs font-semibold uppercase" aria-hidden>
        <span className="bg-line h-px flex-1" />
        {t("or")}
        <span className="bg-line h-px flex-1" />
      </div>

      <button
        type="button"
        onClick={switchMethod}
        className="border-line text-ink hover:bg-mist w-full rounded-full border-2 px-7 py-3 text-base font-semibold transition-colors"
      >
        {method === "password" ? t("useCode") : t("usePassword")}
      </button>
    </form>
  );
}
