"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  requestFreeDownload,
  type FreeDownloadState,
} from "@/lib/free/actions";

/**
 * Free designs: email + newsletter consent, then the download link is
 * mailed (see src/lib/free). Signed-in visitors get their address filled in.
 */
export function FreeDownloadForm({
  productId,
  defaultEmail,
}: {
  productId: string;
  defaultEmail?: string;
}) {
  const t = useTranslations("productPage.free");
  const locale = useLocale();
  const [state, action, pending] = useActionState<FreeDownloadState, FormData>(
    requestFreeDownload,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-1 text-center">
        <p className="font-display text-ink text-lg font-semibold">
          {t("sentTitle")}
        </p>
        <p className="text-ink/70 text-sm">{t("sentBody")}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="locale" value={locale} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <p className="text-ink/80 text-sm">{t("intro")}</p>
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        defaultValue={defaultEmail}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="border-line bg-paper w-full rounded-full border px-4 py-2.5 text-sm"
      />
      <label className="text-ink/80 flex items-start gap-2 text-xs">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0" />
        {t("consent")}
      </label>
      <button
        type="submit"
        disabled={pending}
        className="border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover w-full rounded-full border px-5 py-3 text-base font-semibold backdrop-blur-lg transition-colors disabled:opacity-50"
      >
        {t("submit")}
      </button>
      {state.status === "invalid" && (
        <p className="text-sm text-red-500">{t("invalid")}</p>
      )}
      {state.status === "consent" && (
        <p className="text-sm text-red-500">{t("needConsent")}</p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-red-500">{t("error")}</p>
      )}
    </form>
  );
}
