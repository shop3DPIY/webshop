"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function SignUpForm() {
  const t = useTranslations("auth");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "sent">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    setStatus("loading");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/account`,
      },
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
      <div className="rounded-3xl p-8 text-center glass">
        <h2 className="font-display text-lg font-semibold">{t("checkEmailTitle")}</h2>
        <p className="text-ink/70 mt-2 text-sm">{t("checkEmailBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("nameLabel")}
        <input
          type="text"
          name="name"
          required
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>
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
          minLength={8}
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <Button type="submit" size="lg" disabled={status === "loading"} className="mt-2">
        {t("signUpSubmit")}
      </Button>
    </form>
  );
}
