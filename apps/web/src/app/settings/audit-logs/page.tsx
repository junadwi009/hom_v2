import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { loadAuditLogs } from "@/features/settings/audit-logs/audit-logs-loader";
import { AuditLogsPage } from "@/features/settings/audit-logs/audit-logs-page";
import { getRequiredCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const currentUser = await getRequiredCurrentUser();
  const canView = currentUser.permissions.includes("can_view_audit_logs");

  if (!canView) {
    return (
      <>
        <PageHeader
          eyebrow="Settings"
          title="Audit Logs"
          description="Lihat semua aktivitas penting di sistem untuk menjaga keamanan dan transparansi."
          actions={<Badge tone="warning">Akses ditolak</Badge>}
        />
        <DashboardCard
          title="Tidak memiliki akses"
          description="Modul ini hanya untuk yang berhak melihat audit log."
        >
          <p className="text-sm leading-6 text-foreground-muted">
            Anda tidak memiliki izin <code>can_view_audit_logs</code>. Hubungi
            administrator studio bila Anda membutuhkan akses ini.
          </p>
        </DashboardCard>
      </>
    );
  }

  const logs = await loadAuditLogs();

  return <AuditLogsPage logs={logs} />;
}
