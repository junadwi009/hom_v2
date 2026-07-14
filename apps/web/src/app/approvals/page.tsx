import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { runApprovalAction } from "@/features/approvals/approval-actions";
import { ApprovalsPage } from "@/features/approvals/approvals-page";
import { canAccessApprovalCenter } from "@/features/approvals/approval-helpers";
import { loadApprovalCenterData } from "@/lib/approvals/server/approval-loader";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ rules?: string }>;
}) {
  const [user, params, data] = await Promise.all([
    getCurrentUser().catch(() => null),
    searchParams,
    loadApprovalCenterData(),
  ]);
  const defaultShowRules = params?.rules === "1";

  const currentUser = {
    id: user?.id ?? "anonymous",
    name: user?.fullName ?? "Pengguna",
    roles: user?.roles ?? [],
    permissions: user?.permissions ?? [],
  };

  if (!canAccessApprovalCenter(currentUser)) {
    return (
      <>
        <PageHeader
          eyebrow="Governance"
          title="Approval Center"
          description="Kelola semua permintaan persetujuan lintas modul."
          actions={<Badge tone="warning">Akses ditolak</Badge>}
        />
        <DashboardCard
          title="Tidak memiliki akses"
          description="Approval Center hanya untuk peran manajemen/owner."
        >
          <p className="text-sm leading-6 text-foreground-muted">
            Anda tidak memiliki izin manajemen yang relevan untuk membuka Approval
            Center. Hubungi administrator studio bila Anda membutuhkan akses ini.
          </p>
        </DashboardCard>
      </>
    );
  }

  // Honest error state: never render an empty worklist / zero KPIs when the
  // request list simply failed to load.
  if (data.loadFailed) {
    return (
      <>
        <PageHeader
          eyebrow="Governance"
          title="Approval Center"
          description="Kelola semua permintaan persetujuan lintas modul."
          actions={<Badge tone="warning">Gangguan data</Badge>}
        />
        <DashboardCard
          title="Data approval tidak dapat dimuat"
          description="Terjadi gangguan saat mengambil daftar request."
        >
          <p className="text-sm leading-6 text-foreground-muted">
            Muat ulang halaman ini. Bila masalah berlanjut, hubungi administrator
            studio.
          </p>
        </DashboardCard>
      </>
    );
  }

  return (
    <ApprovalsPage
      currentUser={currentUser}
      dataSource={data.source}
      defaultShowRules={defaultShowRules}
      initialRequests={data.requests}
      initialRules={data.rules}
      runAction={runApprovalAction}
    />
  );
}
