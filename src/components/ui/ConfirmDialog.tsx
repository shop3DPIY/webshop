"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * "Are you sure?" before anything that deletes or can't easily be undone.
 * Two ways to use it:
 *
 * - <ConfirmSubmitButton> inside a server-action <form>: the button opens
 *   the dialog; "Yes" submits the form (with this button's name/value).
 * - <ConfirmDialog> controlled from client code (e.g. removing a photo in
 *   Studio's media fields): render it while `open`, act in onConfirm.
 *
 * Labels are passed in so the same dialog works in English-only Studio
 * and in the translated site.
 */

export interface ConfirmLabels {
  title: string;
  body?: ReactNode;
  confirm: string;
  cancel: string;
}

const DANGER =
  "rounded-full border border-red-300 bg-red-500/80 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600";
const CANCEL =
  "border-line bg-mist hover:bg-paper rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors";

export function ConfirmDialog({
  labels,
  onConfirm,
  onCancel,
}: {
  labels: ConfirmLabels;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Focus "Cancel", so Enter never confirms by accident.
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Portaled to <body>: inside a glass tile (backdrop-filter) "fixed"
  // would only cover that tile.
  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper text-ink border-line flex w-full max-w-md flex-col gap-4 rounded-3xl border p-6 shadow-2xl"
      >
        <h2 id="confirm-title" className="font-display text-lg font-semibold">
          ⚠️ {labels.title}
        </h2>
        {labels.body && <div className="text-ink/75 text-sm">{labels.body}</div>}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button ref={cancelRef} type="button" onClick={onCancel} className={CANCEL}>
            {labels.cancel}
          </button>
          <button type="button" onClick={onConfirm} className={DANGER}>
            {labels.confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmSubmitButton({
  children,
  labels,
  className = DANGER,
  name,
  value,
}: {
  children: ReactNode;
  labels: ConfirmLabels;
  className?: string;
  name?: string;
  value?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* "on" only for the submit that follows "Yes" — server actions
          check it, so a click that skipped the dialog does nothing. */}
      <input ref={confirmRef} type="hidden" name="confirm" defaultValue="" />
      <button
        ref={ref}
        type="submit"
        name={name}
        value={value}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </button>
      {open && (
        <ConfirmDialog
          labels={labels}
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false);
            const button = ref.current;
            if (!button?.form || !confirmRef.current) return;
            // Through the real button, so its name/value travel along;
            // requestSubmit doesn't fire onClick again.
            confirmRef.current.value = "on";
            button.form.requestSubmit(button);
            confirmRef.current.value = "";
          }}
        />
      )}
    </>
  );
}

/** Studio is English-only; these are its default dialog buttons. */
export const STUDIO_CONFIRM = { confirm: "Yes, delete", cancel: "Cancel" };
