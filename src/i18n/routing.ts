import { defineRouting } from "next-intl/routing";

/**
 * Supported locales.
 *
 * Only "en" and "nl" are enabled for now. "de" and "fr" are commented out
 * on purpose: the routing/middleware/translation-loading architecture
 * already supports any number of locales, so enabling them later is just
 * uncommenting the locale code + adding messages/de.json / messages/fr.json
 * — no structural changes needed.
 */
export const locales = [
  "en",
  "nl",
  // "de",
  // "fr",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // English (default) is served at "/", other locales get a prefix ("/nl/...").
  localePrefix: "as-needed",
  // Always default to English at "/" — never auto-switch based on the
  // browser's Accept-Language header. Visitors only get another locale by
  // explicitly picking one (LanguageSwitcher) or visiting a prefixed URL.
  localeDetection: false,
});
