"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function ProfileSettingsForm({
  userId,
  email,
  fullName,
}: {
  userId: string;
  email: string;
  fullName: string;
}) {
  const t = useTranslations("account");
  const [status, setStatus] = useState<"idle" | "loading" | "saved">("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    const name = String(new FormData(event.currentTarget).get("name") ?? "");

    setStatus("loading");
    await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("settingsNameLabel")}
        <input
          type="text"
          name="name"
          defaultValue={fullName}
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("settingsEmailLabel")}
        <input
          type="email"
          value={email}
          disabled
          className="border-line bg-mist rounded-2xl border px-4 py-2.5 text-sm font-normal opacity-70"
        />
      </label>
      <Button type="submit" disabled={status === "loading"} className="self-start">
        {status === "saved" ? "✓" : t("settingsSave")}
      </Button>
    </form>
  );
}
