import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { BranchManagementPage } from "@/features/settings/branch-management/branch-management-page";
import { loadBranches } from "@/features/settings/branch-management/branches-loader";
import { createBranchAction } from "@/features/settings/branch-management/create-branch-action";
import { getRequiredCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const currentUser = await getRequiredCurrentUser();
  const canManage = currentUser.permissions.includes("can_manage_users");

  if (!canManage) {
    return (
      <>
        <PageHeader
          eyebrow="Settings"
          title="Branch Management"
          description="Kelola semua cabang studio Anda dalam satu sistem."
          actions={<Badge tone="warning">Akses ditolak</Badge>}
        />
        <DashboardCard
          title="Tidak memiliki akses"
          description="Modul ini hanya untuk pengelola settings."
        >
          <p className="text-sm leading-6 text-foreground-muted">
            Anda tidak memiliki izin <code>can_manage_users</code>. Hubungi
            administrator studio bila Anda membutuhkan akses ini.
          </p>
        </DashboardCard>
      </>
    );
  }

  const branches = await loadBranches();

  return (
    <BranchManagementPage
      branches={branches}
      canCreate={canManage}
      createAction={createBranchAction}
    />
  );
}
