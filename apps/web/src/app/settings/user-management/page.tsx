import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { createUserAction } from "@/features/settings/create-user-action";
import { setUserRolesAction } from "@/features/settings/set-user-roles-action";
import { setUserStatusAction } from "@/features/settings/set-user-status-action";
import { SettingsManagementPage } from "@/features/settings/settings-management-page";
import { loadUsersPage } from "@/features/settings/users-page-loader";
import { getRequiredCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  const currentUser = await getRequiredCurrentUser();
  const canManage = currentUser.permissions.includes("can_manage_users");

  if (!canManage) {
    return (
      <>
        <PageHeader
          eyebrow="Settings"
          title="User Management"
          description="Kelola akun, role, dan status pengguna studio."
          actions={<Badge tone="warning">Akses ditolak</Badge>}
        />
        <DashboardCard
          title="Tidak memiliki akses"
          description="Modul ini hanya untuk pengelola user."
        >
          <p className="text-sm leading-6 text-foreground-muted">
            Anda tidak memiliki izin <code>can_manage_users</code>. Hubungi
            administrator studio bila Anda membutuhkan akses ini.
          </p>
        </DashboardCard>
      </>
    );
  }

  const state = await loadUsersPage();

  return (
    <SettingsManagementPage
      canManage={canManage}
      createAction={createUserAction}
      currentUserId={currentUser.id}
      setRolesAction={setUserRolesAction}
      setStatusAction={setUserStatusAction}
      state={state}
    />
  );
}
