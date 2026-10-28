"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCurrentTrack } from "@/hooks/useCurrentTrack";

const NAV_KEYS = ["shop", "business", "about"] as const;

export function MobileMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  // Business/commercial licensing only exists for Serious Games.
  const isBusiness = useCurrentTrack() === "business";

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="border-line text-ink flex h-9 w-9 items-center justify-center rounded-full border"
      >
        {open ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      {open && (
        <div className="border-line bg-paper absolute inset-x-0 top-20 z-30 border-b p-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {NAV_KEYS.filter((key) => key !== "business" || isBusiness).map(
              (key) => (
                <Link
                  key={key}
                  href={`/${key}`}
                  onClick={() => setOpen(false)}
                  className="text-ink hover:bg-brand-purple/10 rounded-xl px-3 py-3 text-base font-medium"
                >
                  {t(key)}
                </Link>
              ),
            )}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="hover:bg-mist rounded-xl px-3 py-3 text-base font-medium"
            >
              {t("contact")}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
