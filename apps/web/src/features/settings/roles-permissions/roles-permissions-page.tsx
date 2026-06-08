"use client";

import { KeyRound, Lock, ShieldCheck, UserCog, Users } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  ClientKpiRow,
  type ClientKpi,
} from "@/features/clients/shared/clients-kpi-card";
import { ClientTabs } from "@/features/clients/shared/clients-tabs";

import { PermissionMatrix } from "./permission-matrix";
import { RolePermissionsEditor } from "./role-permissions-editor";
import type { RolesPermissionsData } from "./roles-permissions-loader";
import type { SetRolePermissionsFormAction } from "./roles-permissions-types";

export function RolesPermissionsPage({
  data,
  action,
  canManage,
}: {
  data: RolesPermissionsData;
  action: SetRolePermissionsFormAction;
  canManage: boolean;
}) {
  const [view, setView] = useState(0);

  const operationalRoles = data.roles.filter(
    (role) => role.name !== "super_admin" && role.name !== "studio_director",
  ).length;
  const assignments = data.roles.reduce((total, role) => total + role.userCount, 0);
  const protectedRoles = data.roles.filter(
    (role) => role.name === "super_admin",
  ).length;

  const kpis: ClientKpi[] = [
    {
      icon: Users,
      label: "Total Role",
      value: String(data.roles.length),
      helper: "peran dalam sistem",
      accent: "info",
    },
    {
      icon: ShieldCheck,
      label: "Role Operasional",
      value: String(operationalRoles),
      helper: "selain admin & director",
      accent: "success",
    },
    {
      icon: KeyRound,
      label: "Total Permission",
      value: String(data.permissions.length),
      helper: "akses dapat diatur",
      accent: "default",
    },
    {
      icon: UserCog,
      label: "User Ber-role",
      value: String(assignments),
      helper: "penugasan role",
      accent: "warning",
    },
    {
      icon: Lock,
      label: "Role Terlindungi",
      value: String(protectedRoles),
      helper: "super_admin",
      accent: "danger",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Settings"
        title="Roles & Permissions"
        description="Kelola peran pengguna dan atur akses ke fitur sistem."
      />

      <ClientKpiRow
        className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
        items={kpis}
      />

      <ClientTabs onChange={setView} tabs={["Permission Matrix", "Edit per Role"]} />

      {view === 0 ? (
        <PermissionMatrix
          matrix={data.matrix}
          permissions={data.permissions}
          roles={data.roles}
        />
      ) : (
        <RolePermissionsEditor
          action={action}
          canManage={canManage}
          matrix={data.matrix}
          permissions={data.permissions}
          roles={data.roles}
        />
      )}
    </div>
  );
}
