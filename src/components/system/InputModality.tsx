"use client";

import { useEffect } from "react";

/**
 * Remembers whether the visitor last used the mouse/touch or the keyboard
 * (<html data-input="mouse" | "keyboard">). globals.css hides the focus
 * ring while it's "mouse": browsers sometimes still treat focus as
 * :focus-visible after a click (e.g. a link that stays focused through a
 * client-side navigation), which showed a ring around the button you just
 * clicked. Keyboard users (Tab, arrows) always get the ring.
 */
const NAV_KEYS = new Set(["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);

export function InputModality() {
  useEffect(() => {
    const root = document.documentElement;
    const onPointer = () => root.setAttribute("data-input", "mouse");
    const onKey = (e: KeyboardEvent) => {
      if (NAV_KEYS.has(e.key)) root.setAttribute("data-input", "keyboard");
    };
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);
  return null;
}
