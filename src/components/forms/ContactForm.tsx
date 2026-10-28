"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { sendContactMessage } from "@/lib/contact/actions";
import { Button } from "@/components/ui/Button";
import { BUSINESS_DETAILS } from "@/lib/config/business";

const CONTACT_EMAIL = BUSINESS_DETAILS.contactEmail;

/**
 * `defaultSubject` (from a link like the "Something wrong or missing?"
 * button) is only a suggestion: it shows as placeholder text, and goes
 * along as `topic` so the mail still says what it's about when the
 * visitor types their own subject or leaves it empty.
 */
export function ContactForm({
  defaultSubject = "",
  mailConfigured = false,
}: {
  defaultSubject?: string;
  /** true when the site can send mail itself (Resend); otherwise mailto */
  mailConfigured?: boolean;
}) {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "invalid" | "error"
  >("idle");

  /** No mail service yet: open the visitor's own mail app, pre-filled. */
  function openMailApp(data: FormData) {
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const typed = String(data.get("subject") ?? "").trim();
    const topic = String(data.get("topic") ?? "");
    const subject =
      typed && topic && typed !== topic ? `${typed} (${topic})` : typed || topic;
    const message = String(data.get("message") ?? "");
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    const result = await sendContactMessage(data).catch(() => ({
      status: "error" as const,
    }));
    if (result.status === "fallback") {
      setStatus("idle");
      openMailApp(data);
      return;
    }
    if (result.status === "sent") form.reset();
    setStatus(result.status);
  }

  if (status === "sent") {
    return <p className="text-ink text-base font-medium">{t("formSent")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      {defaultSubject && (
        <input type="hidden" name="topic" value={defaultSubject} />
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("formNameLabel")}
        <input
          type="text"
          name="name"
          required
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("formEmailLabel")}
        <input
          type="email"
          name="email"
          required
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("formSubjectLabel")}
        <input
          type="text"
          name="subject"
          required={!defaultSubject}
          placeholder={defaultSubject || undefined}
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("formMessageLabel")}
        <textarea
          name="message"
          required
          rows={5}
          className="border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal"
        />
      </label>

      {status === "invalid" && (
        <p className="text-sm text-red-200">{t("formInvalid")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-200">{t("formError")}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="mt-2"
        disabled={status === "sending"}
      >
        {status === "sending" ? t("formSending") : t("formSubmit")}
      </Button>
      <p className="text-ink/60 text-xs">
        {mailConfigured ? t("formNoteDirect") : t("formNote")}
      </p>
    </form>
  );
}
