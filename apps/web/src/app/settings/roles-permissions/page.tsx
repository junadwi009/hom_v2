import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { loadRolesPermissions } from "@/features/settings/roles-permissions/roles-permissions-loader";
import { RolesPermissionsPage } from "@/features/settings/roles-permissions/roles-permissions-page";
import { setRolePermissionsAction } from "@/features/settings/roles-permissions/set-role-permissions-action";
import { getRequiredCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const currentUser = await getRequiredCurrentUser();
  const canManage = currentUser.permissions.includes(
    "can_manage_roles_permissions",
  );

  if (!canManage) {
    return (
      <>
        <PageHeader
          eyebrow="Settings"
          title="Roles & Permissions"
          description="Kelola peran pengguna dan atur akses ke fitur sistem."
          actions={<Badge tone="warning">Akses ditolak</Badge>}
        />
        <DashboardCard
          title="Tidak memiliki akses"
          description="Modul ini hanya untuk pengelola role & permission."
        >
          <p className="text-sm leading-6 text-foreground-muted">
            Anda tidak memiliki izin <code>can_manage_roles_permissions</code>.
            Hubungi super admin bila Anda membutuhkan akses ini.
          </p>
        </DashboardCard>
      </>
    );
  }

  const data = await loadRolesPermissions();

  return (
    <RolesPermissionsPage
      action={setRolePermissionsAction}
      canManage={canManage}
      data={data}
    />
  );
}
