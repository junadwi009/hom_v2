"use client";

import { Crown, Lock, ShieldCheck, UserCircle } from "lucide-react";
import { useActionState, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type {
  PermissionInfo,
  RoleSummary,
} from "./roles-permissions-loader";
import {
  initialSetRolePermissionsActionState,
  type SetRolePermissionsActionState,
  type SetRolePermissionsFormAction,
} from "./roles-permissions-types";

const PROTECTED_ROLE = "super_admin";

export function RolePermissionsEditor({
  roles,
  permissions,
  matrix,
  action,
  canManage,
}: {
  roles: RoleSummary[];
  permissions: PermissionInfo[];
  matrix: Record<string, string[]>;
  action: SetRolePermissionsFormAction;
  canManage: boolean;
}) {
  const router = useRouter();
  const firstEditable =
    roles.find((role) => role.name !== PROTECTED_ROLE)?.name ??
    roles[0]?.name ??
    "";
  const [selectedRole, setSelectedRole] = useState(firstEditable);

  const actionWithSuccess = useCallback(
    async (
      previousState: SetRolePermissionsActionState,
      formData: FormData,
    ) => {
      const result = await action(previousState, formData);
      if (result.status === "success") {
        router.refresh();
      }
      return result;
    },
    [action, router],
  );

  const [state, formAction, pending] = useActionState(
    actionWithSuccess,
    initialSetRolePermissionsActionState,
  );

  const grouped = useMemo(() => {
    const map = new Map<string, PermissionInfo[]>();
    for (const permission of permissions) {
      map.set(permission.group, [...(map.get(permission.group) ?? []), permission]);
    }
    return [...map.entries()];
  }, [permissions]);

  const selectedKeys = new Set(matrix[selectedRole] ?? []);
  const isProtected = selectedRole === PROTECTED_ROLE;
  const editable = canManage && !isProtected;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Roles list */}
      <aside className="space-y-1.5 rounded-lg border bg-background-card p-2 shadow-[var(--shadow-soft)]">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-normal text-foreground-muted">
          Daftar Role
        </p>
        {roles.map((role) => {
          const active = role.name === selectedRole;
          const roleProtected = role.name === PROTECTED_ROLE;
          const RoleIcon = roleProtected
            ? Crown
            : role.name === "studio_director"
              ? ShieldCheck
              : UserCircle;
          const permCount = (matrix[role.name] ?? []).length;
          return (
            <button
              className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                active
                  ? "border-accent-gold-muted bg-accent-gold-muted/30"
                  : "border-transparent hover:bg-background"
              }`}
              key={role.name}
              onClick={() => setSelectedRole(role.name)}
              type="button"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  active
                    ? "bg-accent-gold-muted text-amber-900"
                    : "bg-background text-foreground-muted"
                }`}
              >
                <RoleIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {role.name}
                  </span>
                  {roleProtected ? (
                    <Lock aria-hidden="true" className="size-3 text-amber-700" />
                  ) : null}
                </span>
                <span className="block text-xs text-foreground-muted">
                  {role.userCount} user · {permCount} permission
                </span>
              </span>
            </button>
          );
        })}
      </aside>

      {/* Permission editor */}
      <section className="rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              {selectedRole || "—"}
              {isProtected ? <Badge tone="warning">Protected</Badge> : null}
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">
              {isProtected
                ? "Role super_admin selalu punya akses penuh dan tidak bisa diubah."
                : "Centang permission yang dimiliki role ini, lalu simpan."}
            </p>
          </div>
        </div>

        <form action={formAction} key={selectedRole}>
          <input name="roleName" type="hidden" value={selectedRole} />

          <div className="space-y-5">
            {grouped.map(([group, items]) => (
              <fieldset key={group}>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-normal text-amber-800">
                  {group}
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((permission) => (
                    <label
                      className="flex items-start gap-2 rounded-md border bg-background px-3 py-2 text-sm text-foreground"
                      key={permission.key}
                    >
                      <input
                        className="mt-0.5 size-4 rounded border"
                        defaultChecked={selectedKeys.has(permission.key)}
                        disabled={!editable}
                        name="permissionKeys"
                        type="checkbox"
                        value={permission.key}
                      />
                      <span>
                        <span className="font-medium">{permission.key}</span>
                        {permission.description ? (
                          <span className="block text-xs text-foreground-muted">
                            {permission.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          {state.status !== "idle" && state.status !== "success" ? (
            <p
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-900"
              role="alert"
            >
              {state.message ?? "Gagal menyimpan permission."}
            </p>
          ) : null}

          {state.status === "success" ? (
            <p
              className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm leading-5 text-green-900"
              role="status"
            >
              {state.message ?? "Permission disimpan."}
            </p>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button disabled={!editable || pending} type="submit">
              {pending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
