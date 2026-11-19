"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  submitModelRequest,
  type RequestFormState,
} from "@/lib/requests/actions";

const FIELD =
  "border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

/** Wish for a design, or report a problem with one (product prefilled). */
export function RequestForm({
  product,
  initialKind = "request",
  defaultName = "",
  defaultEmail = "",
}: {
  /** The design it's about, from the product page's button */
  product?: { slug: string; title: string };
  initialKind?: "request" | "problem";
  defaultName?: string;
  defaultEmail?: string;
}) {
  const t = useTranslations("requests");
  const locale = useLocale();
  const [kind, setKind] = useState(initialKind);
  const [state, action, pending] = useActionState<RequestFormState, FormData>(
    submitModelRequest,
    { status: "idle" },
  );

  const sentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "sent")
      sentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.status]);

  if (state.status === "sent") {
    return (
      <div ref={sentRef} role="status" className="flex flex-col gap-2">
        <p className="text-ink text-base font-semibold">{t("sentTitle")}</p>
        <p className="text-ink text-sm">
          {kind === "problem" ? t("sentBodyProblem") : t("sentBody")}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {product && <input type="hidden" name="product" value={product.slug} />}

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t("kindLabel")}</legend>
        {(["request", "problem"] as const).map((k) => (
          <label
            key={k}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              kind === k
                ? "border-brand-purple bg-brand-purple/45 text-ink"
                : "border-line bg-paper hover:bg-mist"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={k}
              checked={kind === k}
              onChange={() => setKind(k)}
              className="sr-only"
            />
            {k === "request" ? t("kindRequest") : t("kindProblem")}
          </label>
        ))}
      </fieldset>

      {product && (
        <p className="text-ink text-sm">
          {t("about")} <span className="text-ink font-semibold">{product.title}</span>
        </p>
      )}

      <label className={LABEL}>
        {kind === "problem" ? t("titleProblem") : t("titleRequest")}
        <input
          type="text"
          name="title"
          required
          maxLength={150}
          placeholder={kind === "problem" ? t("titleProblemPh") : t("titleRequestPh")}
          className={FIELD}
        />
      </label>

      <label className={LABEL}>
        {t("detailsLabel")}
        <textarea
          name="details"
          rows={4}
          maxLength={4000}
          placeholder={kind === "problem" ? t("detailsProblemPh") : t("detailsRequestPh")}
          className={FIELD}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={LABEL}>
          {t("nameLabel")}
          <input type="text" name="name" required defaultValue={defaultName} className={FIELD} />
        </label>
        <label className={LABEL}>
          {t("emailLabel")}
          <input type="email" name="email" required defaultValue={defaultEmail} className={FIELD} />
        </label>
      </div>

      {state.status === "invalid" && <p className="text-sm text-red-200">{t("invalid")}</p>}
      {state.status === "error" && <p className="text-sm text-red-200">{t("error")}</p>}

      <Button type="submit" size="lg" className="mt-1" disabled={pending}>
        {pending ? t("sending") : t("submit")}
      </Button>
      <p className="text-ink text-xs">
        {kind === "problem" ? t("noteProblem") : t("noteRequest")}
      </p>
    </form>
  );
}
