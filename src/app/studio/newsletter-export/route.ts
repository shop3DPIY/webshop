import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/studio/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { manageUrl } from "@/lib/newsletter/server";

/** CSV of active subscribers, with each one's personal manage/unsubscribe link. */
export async function GET() {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return new NextResponse("Not configured", { status: 503 });

  const { data } = await admin
    .from("newsletter_subscribers")
    .select("email, token, all_categories, categories, locale, created_at")
    .eq("status", "subscribed")
    .order("created_at");

  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    ["email", "categories", "locale", "subscribed_at", "manage_link"].join(","),
    ...(data ?? []).map((r) =>
      [
        cell(r.email),
        cell(r.all_categories ? "all" : r.categories.join(" ")),
        r.locale,
        r.created_at,
        cell(manageUrl(r.token, r.locale)),
      ].join(","),
    ),
  ];

  return new NextResponse(lines.join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="3dpiy-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
