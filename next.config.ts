import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // /dolls used to be the Shop's start page (the Shop side was called the
  // "dolls" track). The Shop starts at /shop now; /dolls means what it
  // says and opens the Doll & Mini collection.
  async redirects() {
    return [
      { source: "/dolls", destination: "/collections/doll-mini", permanent: true },
      { source: "/nl/dolls", destination: "/nl/collections/doll-mini", permanent: true },
    ];
  },
  images: {
    // Product photos uploaded via 3DPIY Studio are served from Supabase's
    // public storage bucket once that's connected (see SETUP.md) — allow
    // next/image to optimize them.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
