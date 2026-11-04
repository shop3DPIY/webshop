"use client";

import { useRouter } from "@/i18n/navigation";

/**
 * "← Back" to the page the visitor came from (e.g. a product's license
 * ⓘ link), for people who don't know the browser's back button. Opened
 * directly (no page of ours before it) it goes to the shop instead.
 */
export function BackButton({ label }: { label: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        const cameFromUs =
          document.referrer &&
          new URL(document.referrer).origin === window.location.origin;
        if (cameFromUs && window.history.length > 1) router.back();
        else router.push("/shop");
      }}
      className="text-ink/60 hover:text-ink w-fit text-sm font-medium"
    >
      ← {label}
    </button>
  );
}
