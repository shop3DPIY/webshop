import { AdminShell } from "@/components/studio/AdminShell";
import { requireAdmin } from "@/lib/studio/guard";

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
  return (
    <AdminShell adminName={profile?.full_name} adminEmail={profile?.email}>
      {children}
    </AdminShell>
  );
}
