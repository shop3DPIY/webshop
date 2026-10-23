"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { BUSINESS_DETAILS } from "@/lib/config/business";

const CONTACT_EMAIL = BUSINESS_DETAILS.contactEmail;

export function ContactForm({
  defaultSubject = "",
}: {
  defaultSubject?: string;
}) {
  const t = useTranslations("contact");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // Honeypot: real visitors never fill this hidden field.
    if (data.get("company")) return;

    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const subject = String(data.get("subject") ?? "");
    const message = String(data.get("message") ?? "");

    const body = `${message}\n\n— ${name} (${email})`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
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
          required
          defaultValue={defaultSubject}
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

      <Button type="submit" size="lg" className="mt-2">
        {t("formSubmit")}
      </Button>
      <p className="text-ink/60 text-xs">{t("formNote")}</p>
    </form>
  );
}
