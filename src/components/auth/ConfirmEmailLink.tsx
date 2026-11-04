"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

/**
 * The button on /auth/confirm. The one-time token from the mail is only
 * spent here, on a real click — not when a mail scanner (Outlook Safe
 * Links) opens the link, and it works in any browser or on any device,
 * unlike the PKCE code flow that needs the browser that asked for the mail.
 */
export function ConfirmEmailLink({
  tokenHash,
  type,
  next,
}: {
  tokenHash: string;
  type: EmailOtpType;
  next: string;
}) {
  const t = useTranslations("auth");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function confirm() {
    const supabase = createClient();
    if (!supabase) return;
    setStatus("loading");
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      setStatus("error");
      return;
    }
    // Full navigation so the server sees the new session cookies.
    window.location.assign(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <Button size="lg" onClick={confirm} disabled={status === "loading"}>
        {type === "recovery" ? t("confirmContinueReset") : t("confirmContinue")}
      </Button>
      {status === "error" && (
        <p className="text-sm text-red-600">{t("linkExpiredShort")}</p>
      )}
    </div>
  );
}
