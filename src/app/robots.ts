import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin, personal pages and API routes are of no use in search.
      disallow: ["/studio", "/api/", "/account", "/nl/account", "/checkout", "/nl/checkout"],
    },
    sitemap: "https://3dpiy.com/sitemap.xml",
  };
}
