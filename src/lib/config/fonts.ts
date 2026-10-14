import { Fredoka, Inter } from "next/font/google";

/**
 * Site-wide typefaces. Change the font here only — it's imported once in
 * the root layout, so swapping typefaces later is a one-file edit.
 *
 * `fontHeading` drives headings (h1–h4, see globals.css), `fontBody` drives
 * everything else.
 */
export const fontHeading = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const fontBody = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
