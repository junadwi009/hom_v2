import { Check, Crown, Minus } from "lucide-react";

import type {
  PermissionInfo,
  RoleSummary,
} from "./roles-permissions-loader";

function titleCase(name: string): string {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Read-only permission matrix: permission rows (grouped by module) × role columns,
// with a check when the role holds the permission and a muted dash otherwise.
export function PermissionMatrix({
  roles,
  permissions,
  matrix,
}: {
  roles: RoleSummary[];
  permissions: PermissionInfo[];
  matrix: Record<string, string[]>;
}) {
  const roleHas = new Map(
    roles.map((role) => [role.name, new Set(matrix[role.name] ?? [])]),
  );

  // Group permissions by their display group, preserving sorted order.
  const groups: { group: string; items: PermissionInfo[] }[] = [];
  for (const permission of permissions) {
    const last = groups[groups.length - 1];
    if (last && last.group === permission.group) {
      last.items.push(permission);
    } else {
      groups.push({ group: permission.group, items: [permission] });
    }
  }

  return (
    <section className="rounded-lg border bg-background-card shadow-[var(--shadow-soft)]">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">
          Permission Matrix
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Akses tiap role terhadap setiap permission sistem.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-foreground-muted">
              <th className="sticky left-0 z-10 border-b bg-background-card px-4 py-3 font-semibold">
                Permission
              </th>
              {roles.map((role) => (
                <th
                  className="border-b px-3 py-3 text-center font-semibold"
                  key={role.name}
                >
                  <span className="flex items-center justify-center gap-1">
                    {role.name === "super_admin" ? (
                      <Crown aria-hidden="true" className="size-3.5 text-amber-700" />
                    ) : null}
                    {titleCase(role.name)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(({ group, items }) => (
              <ModuleGroup
                group={group}
                items={items}
                key={group}
                roleHas={roleHas}
                roles={roles}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t px-5 py-3 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-1.5">
          <Check aria-hidden="true" className="size-4 text-green-600" />
          Akses Diizinkan
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus aria-hidden="true" className="size-4 text-stone-400" />
          Tidak Ada Akses
        </span>
      </div>
    </section>
  );
}

function ModuleGroup({
  group,
  items,
  roles,
  roleHas,
}: {
  group: string;
  items: PermissionInfo[];
  roles: RoleSummary[];
  roleHas: Map<string, Set<string>>;
}) {
  return (
    <>
      <tr className="bg-stone-50/70">
        <td
          className="sticky left-0 z-10 bg-stone-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-normal text-amber-800"
          colSpan={roles.length + 1}
        >
          {group}
        </td>
      </tr>
      {items.map((permission) => (
        <tr className="border-b last:border-b-0 hover:bg-stone-50/40" key={permission.key}>
          <td className="sticky left-0 z-10 bg-background-card px-4 py-2.5">
            <span className="font-medium text-foreground">{permission.key}</span>
            {permission.description ? (
              <span className="block text-xs text-foreground-muted">
                {permission.description}
              </span>
            ) : null}
          </td>
          {roles.map((role) => {
            const allowed = roleHas.get(role.name)?.has(permission.key);
            return (
              <td className="px-3 py-2.5 text-center" key={role.name}>
                {allowed ? (
                  <Check
                    aria-label="Diizinkan"
                    className="mx-auto size-4 text-green-600"
                  />
                ) : (
                  <Minus
                    aria-label="Tidak ada akses"
                    className="mx-auto size-4 text-stone-300"
                  />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
