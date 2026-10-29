import { AdminShell } from "@/components/studio/AdminShell";
import { requireAdmin } from "@/lib/studio/guard";
import { createClient } from "@/lib/supabase/server";

// Every page here needs a live admin session on every request — there is
// no useful "static" version of an admin dashboard. Forcing dynamic also
// avoids build-time prerendering ever calling createClient() before
// Supabase env vars exist (it returns null without touching cookies(),
// so Next has no other signal to skip static generation here).
export const dynamic = "force-dynamic";

export default async function ProtectedStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();
  const supabase = await createClient();
  const { count: draftCount } = await supabase!
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("publication_status", "draft");
  return (
    <AdminShell
      adminName={profile?.full_name}
      adminEmail={profile?.email}
      draftCount={draftCount ?? 0}
    >
      {children}
    </AdminShell>
  );
}
