import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RoleSummary = {
  name: string;
  description: string | null;
  userCount: number;
};

export type PermissionInfo = {
  key: string;
  description: string | null;
  group: string;
};

export type RolesPermissionsData = {
  roles: RoleSummary[];
  permissions: PermissionInfo[];
  // role name -> permission keys it currently holds
  matrix: Record<string, string[]>;
};

type RoleRow = { id: string; name: string; description: string | null };
type PermissionRow = { id: string; key: string; description: string | null };
type RolePermissionRow = { role_id: string; permission_id: string };
type UserRoleRow = { role_id: string };

// Derive a coarse display group from a permission key so the editor can show
// grouped checklists (mirrors the mockup's module grouping).
function permissionGroup(key: string): string {
  if (key.includes("user") || key.includes("role") || key.includes("audit"))
    return "Administration";
  if (key.includes("client")) return "Clients";
  if (key.includes("practitioner")) return "Practitioners";
  if (key.includes("appointment")) return "Appointments";
  if (key.includes("service") || key.includes("package")) return "Catalog";
  if (
    key.includes("financial") ||
    key.includes("payment") ||
    key.includes("reimbursement")
  )
    return "Finance";
  if (key.includes("clinical") || key.includes("session_note"))
    return "Clinical";
  if (key.includes("team_attendance")) return "Team";
  if (key.includes("whatsapp")) return "Communication";
  if (key.includes("ai")) return "AI";
  if (key.includes("knowledge")) return "Knowledge";
  return "Lainnya";
}

// Loads roles, the permission catalog (grouped), per-role user counts, and the
// current role->permission matrix from the RBAC tables. Returns empty
// collections on failure so the page can render gracefully.
export async function loadRolesPermissions(): Promise<RolesPermissionsData> {
  try {
    const supabase = await createSupabaseServerClient();

    const [rolesResult, permissionsResult, rolePermsResult, userRolesResult] =
      await Promise.all([
        supabase.from("roles").select("id, name, description"),
        supabase.from("permissions").select("id, key, description"),
        supabase.from("role_permissions").select("role_id, permission_id"),
        supabase.from("user_roles").select("role_id"),
      ]);

    const roleRows = (rolesResult.data as RoleRow[]) ?? [];
    const permissionRows = (permissionsResult.data as PermissionRow[]) ?? [];
    const rolePermRows = (rolePermsResult.data as RolePermissionRow[]) ?? [];
    const userRoleRows = (userRolesResult.data as UserRoleRow[]) ?? [];

    const roleNameById = new Map(roleRows.map((r) => [r.id, r.name]));
    const permissionKeyById = new Map(permissionRows.map((p) => [p.id, p.key]));

    const userCountByRoleId = new Map<string, number>();
    for (const row of userRoleRows) {
      userCountByRoleId.set(
        row.role_id,
        (userCountByRoleId.get(row.role_id) ?? 0) + 1,
      );
    }

    const matrix: Record<string, string[]> = {};
    for (const role of roleRows) {
      matrix[role.name] = [];
    }
    for (const row of rolePermRows) {
      const roleName = roleNameById.get(row.role_id);
      const permissionKey = permissionKeyById.get(row.permission_id);
      if (roleName && permissionKey) {
        matrix[roleName] = [...(matrix[roleName] ?? []), permissionKey];
      }
    }

    const roles: RoleSummary[] = roleRows
      .map((role) => ({
        name: role.name,
        description: role.description,
        userCount: userCountByRoleId.get(role.id) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const permissions: PermissionInfo[] = permissionRows
      .map((permission) => ({
        key: permission.key,
        description: permission.description,
        group: permissionGroup(permission.key),
      }))
      .sort(
        (a, b) =>
          a.group.localeCompare(b.group) || a.key.localeCompare(b.key),
      );

    return { roles, permissions, matrix };
  } catch {
    return { roles: [], permissions: [], matrix: {} };
  }
}
