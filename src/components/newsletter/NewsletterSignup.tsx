"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  subscribeToNewsletter,
  type SignupState,
} from "@/lib/newsletter/actions";

/** Footer signup: an email field and a button — every category by default. */
export function NewsletterSignup() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [state, action, pending] = useActionState<SignupState, FormData>(
    subscribeToNewsletter,
    {
      status: "idle",
    },
  );

  if (state.status === "ok") {
    return <p className="text-ink/80 text-sm">{t("ok")}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="border-line bg-paper w-full min-w-0 rounded-full border px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover shrink-0 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-lg transition-colors disabled:opacity-50"
        >
          {t("submit")}
        </button>
      </div>
      {state.status === "invalid" && (
        <p className="text-xs text-red-200">{t("invalid")}</p>
      )}
      {state.status === "error" && (
        <p className="text-xs text-red-200">{t("error")}</p>
      )}
      <p className="text-ink/60 text-xs">
        {t.rich("consent", {
          privacy: (chunks) => (
            <Link
              href="/legal/privacy"
              className="underline underline-offset-2"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
