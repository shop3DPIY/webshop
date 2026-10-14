"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Minimal, dependency-free dark mode implementation.
 *
 * The server already knows the right theme before it renders anything —
 * see src/app/[locale]/layout.tsx, which reads the `theme` cookie and
 * puts the `dark` class on <html> directly. That means there is no flash
 * of the wrong theme to prevent, and therefore no need for any inline
 * script (which is why we don't use next-themes or next/script here: both
 * render a <script> tag, which triggers React 19.2's "script tag while
 * rendering" dev warning).
 *
 * This provider only has to do two things: let components read the
 * current theme, and let the toggle flip it (updating the DOM class
 * instantly, and writing the cookie so the next page load is correct too).
 *
 * Light is always the default — dark mode is strictly opt-in via the
 * toggle and does NOT follow the OS/browser color scheme preference.
 */

type Theme = "light" | "dark";

const COOKIE_NAME = "theme";

function writeThemeCookie(theme: Theme) {
  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: Theme;
}) {
  // Passed in from the layout, which already read the cookie server-side —
  // this must match what the server rendered exactly, or React logs a
  // hydration mismatch (a client-only `document` check would disagree
  // with the server's always-"light" assumption).
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  function setTheme(next: Theme) {
    document.documentElement.classList.toggle("dark", next === "dark");
    writeThemeCookie(next);
    setThemeState(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
