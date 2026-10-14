"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "sent">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    const email = String(new FormData(event.currentTarget).get("email") ?? "");

    setStatus("loading");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="border-line rounded-3xl border p-8 text-center">
        <h2 className="font-display text-lg font-semibold">{t("checkEmailTitle")}</h2>
        <p className="text-ink/70 mt-2 text-sm">{t("checkEmailBody")}</p>
      </div>
    );
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

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" size="lg" disabled={status === "loading"} className="mt-2">
        {t("forgotSubmit")}
      </Button>
    </form>
  );
}
