"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface GalleryImage {
  src: string;
  alt: string;
}

/**
 * Product photos: swipe (or use the arrows/thumbnails) through them in
 * place, tap one to see it large on top of the page — never a new page,
 * which visitors on phones didn't know how to get back from.
 */
export function ProductGallery({
  images,
  borderClass,
  washClass,
  badge,
}: {
  images: GalleryImage[];
  borderClass: string;
  washClass: string;
  /** collection badge, shown on top of the photos */
  badge: React.ReactNode;
}) {
  const t = useTranslations("productPage.gallery");
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const total = images.length;

  const goTo = useCallback((i: number, smooth = true) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({
      left: i * el.clientWidth,
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  // The visible photo follows the swipe position.
  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`glass relative aspect-square overflow-hidden rounded-xl ${borderClass} ${washClass}`}
      >
        <div
          ref={track}
          onScroll={onScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={t("open", { n: i + 1, total })}
              className="relative h-full w-full shrink-0 cursor-zoom-in snap-center"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority={i === 0}
              />
            </button>
          ))}
        </div>
        {badge}
        {total > 1 && (
          <>
            <ArrowButton
              side="left"
              label={t("previous")}
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            />
            <ArrowButton
              side="right"
              label={t("next")}
              disabled={index === total - 1}
              onClick={() => goTo(index + 1)}
            />
            <span className="bg-night/60 absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white">
              {t("counter", { n: index + 1, total })}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t("show", { n: i + 1 })}
              aria-current={i === index}
              className={`glass relative aspect-square overflow-hidden rounded-lg transition-opacity ${borderClass} ${
                i === index ? "opacity-100" : "opacity-60 hover:opacity-90"
              }`}
            >
              <Image
                src={image.src}
                alt=""
                fill
                className="object-cover"
                sizes="20vw"
              />
            </button>
          ))}
        </div>
      )}

      {open !== null && (
        <Lightbox
          images={images}
          start={open}
          onClose={(last) => {
            setOpen(null);
            goTo(last, false);
          }}
        />
      )}
    </div>
  );
}

function ArrowButton({
  side,
  label,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`absolute top-1/2 ${side === "left" ? "left-3" : "right-3"} flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-white/40 text-lg font-semibold text-white backdrop-blur-lg transition-opacity hover:bg-white/60 disabled:opacity-0`}
    >
      {side === "left" ? "←" : "→"}
    </button>
  );
}

/** Photos full-screen over the page; swipe, arrows, Esc or × to close. */
function Lightbox({
  images,
  start,
  onClose,
}: {
  images: GalleryImage[];
  start: number;
  onClose: (last: number) => void;
}) {
  const t = useTranslations("productPage.gallery");
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);
  const total = images.length;

  const goTo = (i: number, smooth = true) =>
    track.current?.scrollTo({
      left: i * track.current.clientWidth,
      behavior: smooth ? "smooth" : "instant",
    });

  useEffect(() => {
    goTo(start, false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(index);
      if (e.key === "ArrowLeft" && index > 0) goTo(index - 1);
      if (e.key === "ArrowRight" && index < total - 1) goTo(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, total, onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm"
    >
      <div
        ref={track}
        onScroll={() => {
          const el = track.current;
          if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image) => (
          <div
            key={image.src}
            onClick={() => onClose(index)}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-contain p-4 sm:p-12"
              sizes="100vw"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onClose(index)}
        aria-label={t("close")}
        className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white/30 text-xl font-semibold text-white backdrop-blur-lg hover:bg-white/50"
      >
        ×
      </button>
      {total > 1 && (
        <>
          <ArrowButton
            side="left"
            label={t("previous")}
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          />
          <ArrowButton
            side="right"
            label={t("next")}
            disabled={index === total - 1}
            onClick={() => goTo(index + 1)}
          />
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white">
            {t("counter", { n: index + 1, total })}
          </span>
        </>
      )}
    </div>,
    document.body,
  );
}
