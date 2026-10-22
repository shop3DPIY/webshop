"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Dev-only switcher for the candidate site backdrops defined in
 * globals.css (see the `--backdrop-*` tokens there). Sets
 * <html data-bg="…"> and remembers the choice in localStorage, so the
 * candidates can be compared live on any page (or forced with ?bg=<id>). Renders nothing in
 * production — once a backdrop is chosen, make it the bare :root value in
 * globals.css and delete this component.
 */
const OPTIONS = [
  { id: "banner", label: "Banner" },
  { id: "night", label: "Night" },
  { id: "graphite", label: "Graphite" },
  { id: "spectrum", label: "Spectrum" },
  { id: "plum", label: "Plum" },
  { id: "slate", label: "Slate" },
] as const;

const STORAGE_KEY = "3dpiy-backdrop";
const CHANGE_EVENT = "3dpiy-backdrop-change";

function readSaved(): string {
  // ?bg=<id> wins (handy for sharing/screenshotting one candidate).
  const fromUrl = new URLSearchParams(window.location.search).get("bg");
  if (fromUrl) return fromUrl;
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "banner";
  } catch {
    return "banner";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function choose(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function BackdropPicker() {
  const active = useSyncExternalStore(subscribe, readSaved, () => "banner");

  useEffect(() => {
    document.documentElement.setAttribute("data-bg", active);
  }, [active]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="glass fixed right-4 bottom-4 z-50 flex items-center gap-1 rounded-full p-1 text-xs font-medium">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => choose(o.id)}
          className={`rounded-full px-3 py-1.5 transition-colors ${
            active === o.id ? "bg-white text-night" : "text-ink hover:bg-white/20"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
