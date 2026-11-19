"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { makeEligibility, submitMake } from "@/lib/makes/actions";

const FIELD =
  "border-line bg-paper rounded-2xl border px-4 py-2.5 text-sm font-normal";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

/**
 * Shrinks a photo in the browser to a JPEG under ~900 KB (server actions
 * take 1 MB). Redrawing on a canvas also drops EXIF data such as GPS.
 * Safari decodes iPhone HEIC photos itself, so those work too.
 */
async function toJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  for (const [maxSide, quality] of [
    [1600, 0.85],
    [1400, 0.8],
    [1200, 0.72],
    [1000, 0.65],
  ] as const) {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size < 900 * 1024) return blob;
  }
  throw new Error("too-big");
}

/** "Printed it? Share a photo" — for owners of the design. */
export function MakeShare({ productId }: { productId: string }) {
  const t = useTranslations("makes");
  const pathname = usePathname();
  const [step, setStep] = useState<
    "closed" | "checking" | "signIn" | "notOwner" | "form" | "sending" | "sent"
  >("closed");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setStep("checking");
    const result = await makeEligibility(productId).catch(() => null);
    if (!result?.signedIn) return setStep("signIn");
    if (!result.owns) return setStep("notOwner");
    setName(result.name);
    setStep("form");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0) return setError(t("errorPhoto"));
    setError(null);
    setStep("sending");
    try {
      form.set("photo", new File([await toJpeg(file)], "make.jpg", { type: "image/jpeg" }));
    } catch {
      setStep("form");
      return setError(t("errorPhoto"));
    }
    const result = await submitMake(form).catch(() => ({ status: "error" as const }));
    if (result.status === "sent") return setStep("sent");
    setStep("form");
    setError(
      result.status === "limit"
        ? t("errorLimit")
        : result.status === "invalid"
          ? t("errorInvalid")
          : t("errorGeneric"),
    );
  }

  if (step === "closed" || step === "checking") {
    return (
      <Button variant="secondary" onClick={open} disabled={step === "checking"}>
        📸 {t("share")}
      </Button>
    );
  }
  if (step === "signIn") {
    return (
      <p className="text-ink/70 text-sm">
        {t("signInFirst")}{" "}
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent(pathname)}`}
          className="text-ink font-semibold underline"
        >
          {t("signIn")}
        </Link>
      </p>
    );
  }
  if (step === "notOwner") return <p className="text-ink/70 text-sm">{t("ownersOnly")}</p>;
  if (step === "sent") {
    return (
      <p role="status" className="text-ink text-sm font-medium">
        ✓ {t("sent")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xl flex-col gap-4 rounded-3xl p-5 glass">
      <input type="hidden" name="productId" value={productId} />
      <label className={LABEL}>
        {t("photo")}
        <input type="file" name="photo" accept="image/*" required className="file-upload" />
      </label>
      <label className={LABEL}>
        {t("displayName")}
        <input
          type="text"
          name="displayName"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={FIELD}
        />
      </label>
      <label className={LABEL}>
        {t("caption")}
        <input type="text" name="caption" maxLength={300} placeholder={t("captionPh")} className={FIELD} />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 shrink-0" />
        {t("consent")}
      </label>
      {error && <p className="text-sm text-red-200">{error}</p>}
      <Button type="submit" disabled={step === "sending"} className="w-fit">
        {step === "sending" ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
