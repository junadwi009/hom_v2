"use client";

import type { AdminUser } from "@hom/domain/users";
import { useState } from "react";

import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

import { ChangeStatusDialog } from "./change-status-dialog";
import { CreateUserSheet } from "./create-user-sheet";
import { EditRolesDialog } from "./edit-roles-dialog";
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

  const users = state.status === "ready" ? state.users : [];

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
      <DashboardCard
        title="Daftar User"
        description="Semua akun aplikasi beserta role dan statusnya."
      >
        {state.status === "error" ? (
          <p
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
            role="alert"
          >
            Daftar user gagal dimuat. Coba muat ulang halaman.
          </p>
        ) : (
          <UsersTable
            canManage={canManage}
            currentUserId={currentUserId}
            onChangeStatus={setStatusUser}
            onEditRoles={setRolesUser}
            users={users}
          />
        )}
      </DashboardCard>
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
