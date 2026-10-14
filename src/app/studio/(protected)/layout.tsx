import { AdminShell } from "@/components/studio/AdminShell";
import { requireAdmin } from "@/lib/studio/guard";

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
