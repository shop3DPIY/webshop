"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

/**
 * One sign-in form for everyone — customers and the admin alike. After a
 * successful sign-in we check the profile's role: admins always land in
 * 3DPIY Studio (outside the [locale] tree, so a plain location change, not
 * the i18n-aware router), everyone else goes to `redirectTo` (defaults to
 * "/account"). There is no separate admin sign-in screen.
 */
export function SignInForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    setStatus("loading");
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", signInData.user.id)
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("emailLabel")}
        <input
          type="email"
          name="email"
          required
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("passwordLabel")}
        <input
          type="password"
          name="password"
          required
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" size="lg" disabled={status === "loading"} className="mt-2">
        {t("signInSubmit")}
      </Button>
    </form>
  );
}
