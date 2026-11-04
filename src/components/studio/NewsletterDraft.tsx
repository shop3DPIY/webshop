"use client";

import { useEffect } from "react";

const KEY = "studio-newsletter-draft";

/**
 * Keeps the newsletter form filled in across "Send test to me" and error
 * redirects: React empties a form after its server action runs, so
 * without this the subject and message had to be typed again before the
 * real send. The draft lives in this browser tab only (sessionStorage)
 * and is dropped once the newsletter has gone out.
 */
export function NewsletterDraft({
  formId,
  sent,
}: {
  formId: string;
  /** the newsletter was just sent to subscribers */
  sent: boolean;
}) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    const save = () => {
      const data = new FormData(form);
      const draft = {
        subject: data.get("subject"),
        message: data.get("message"),
        audience: data.get("audience"),
        categories: data.getAll("categories"),
      };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(draft));
      } catch {}
    };

    const restore = () => {
      let draft: {
        subject?: string;
        message?: string;
        audience?: string;
        categories?: string[];
      } | null = null;
      try {
        draft = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      } catch {}
      if (!draft) return;
      const field = (name: string) =>
        form.elements.namedItem(name) as HTMLInputElement | null;
      if (draft.subject) field("subject")!.value = draft.subject;
      if (draft.message) field("message")!.value = draft.message;
      form
        .querySelectorAll<HTMLInputElement>('input[name="audience"]')
        .forEach((r) => (r.checked = r.value === draft!.audience));
      form
        .querySelectorAll<HTMLInputElement>('input[name="categories"]')
        .forEach((c) => (c.checked = !!draft!.categories?.includes(c.value)));
    };

    if (sent) {
      try {
        sessionStorage.removeItem(KEY);
      } catch {}
    } else {
      restore();
    }

    form.addEventListener("input", save);
    form.addEventListener("change", save);
    // React resets the form after the action; put the draft back after it.
    const onReset = () => setTimeout(restore, 0);
    form.addEventListener("reset", onReset);
    return () => {
      form.removeEventListener("input", save);
      form.removeEventListener("change", save);
      form.removeEventListener("reset", onReset);
    };
  }, [formId, sent]);

  return null;
}
