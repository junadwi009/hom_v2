"use client";

import type { AdminUser } from "@hom/domain/users";
import { ShieldCheck, UserCog, UserX, Users } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  ClientKpiRow,
  type ClientKpi,
} from "@/features/clients/shared/clients-kpi-card";
import { ClientsToolbar } from "@/features/clients/shared/clients-toolbar";

import { ChangeStatusDialog } from "./change-status-dialog";
import { CreateUserSheet } from "./create-user-sheet";
import { EditRolesDialog } from "./edit-roles-dialog";
import { UserDetailPanel } from "./user-detail-panel";
import type { UsersPageState } from "./users-page-loader";
import { UsersTable } from "./users-table";
import type { UserAdminFormAction } from "./users-action-types";

type SettingsManagementPageProps = {
  state: UsersPageState;
  currentUserId?: string | null;
  canManage: boolean;
  createAction: UserAdminFormAction;
  setRolesAction: UserAdminFormAction;
  setStatusAction: UserAdminFormAction;
};

export function SettingsManagementPage({
  state,
  currentUserId,
  canManage,
  createAction,
  setRolesAction,
  setStatusAction,
}: SettingsManagementPageProps) {
  const [rolesUser, setRolesUser] = useState<AdminUser | null>(null);
  const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const users = state.status === "ready" ? state.users : [];
  const selectedUser =
    users.find((user) => user.id === selectedId) ?? users[0] ?? null;

  const adminRoles = new Set(["super_admin", "studio_director"]);
  const activeUsers = users.filter((user) => user.status === "active").length;
  const adminUsers = users.filter((user) =>
    user.roles.some((role) => adminRoles.has(role)),
  ).length;
  const inactiveUsers = users.filter((user) => user.status !== "active").length;

  const kpis: ClientKpi[] = [
    {
      icon: Users,
      label: "Total Users",
      value: String(users.length),
      helper: "akun terdaftar",
      accent: "info",
    },
    {
      icon: ShieldCheck,
      label: "Active Users",
      value: String(activeUsers),
      helper:
        users.length > 0
          ? `${Math.round((activeUsers / users.length) * 100)}% dari total`
          : "0% dari total",
      accent: "success",
    },
    {
      icon: UserCog,
      label: "Admin Users",
      value: String(adminUsers),
      helper: "super admin & director",
      accent: "warning",
    },
    {
      icon: UserX,
      label: "Inactive Users",
      value: String(inactiveUsers),
      helper: "non-aktif / suspended",
      accent: inactiveUsers > 0 ? "danger" : "default",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="User Management"
        description="Kelola akun, role, dan status pengguna studio."
        actions={
          <CreateUserSheet
            action={createAction}
            canManage={canManage}
            dataMode={state.dataMode}
          />
        }
      />
      <ClientKpiRow className="grid-cols-2 sm:grid-cols-4" items={kpis} />

      {state.status === "error" ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
          role="alert"
        >
          Daftar user gagal dimuat. Coba muat ulang halaman.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-3 xl:col-span-2">
            <ClientsToolbar
              filters={[
                { label: "Status", options: ["Semua", "active", "inactive", "invited", "suspended"] },
              ]}
              searchPlaceholder="Cari nama, email, atau role..."
            />
            <UsersTable
              canManage={canManage}
              currentUserId={currentUserId}
              onChangeStatus={setStatusUser}
              onEditRoles={setRolesUser}
              onSelect={(user) => setSelectedId(user.id)}
              selectedId={selectedUser?.id}
              users={users}
            />
          </div>
          <div className="xl:col-span-1">
            <UserDetailPanel user={selectedUser} />
          </div>
        </div>
      )}

      {!canManage ? (
        <Badge tone="warning">
          Mode baca: Anda tidak memiliki izin mengelola user.
        </Badge>
      ) : null}
      {rolesUser ? (
        <EditRolesDialog
          action={setRolesAction}
          key={`roles-${rolesUser.id}`}
          onClose={() => setRolesUser(null)}
          user={rolesUser}
        />
      ) : null}
      {statusUser ? (
        <ChangeStatusDialog
          action={setStatusAction}
          key={`status-${statusUser.id}`}
          onClose={() => setStatusUser(null)}
          user={statusUser}
        />
      ) : null}
    </>
  );
}
