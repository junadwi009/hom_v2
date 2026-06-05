import { roleNames, type RoleName } from "@hom/domain/rbac";

const roleLabels: Record<RoleName, string> = {
  super_admin: "Super Admin",
  studio_director: "Studio Director",
  admin_frontdesk: "Admin Front Desk",
  practitioner: "Practitioner",
  finance_admin: "Finance Admin",
  marketing_admin: "Marketing Admin",
  viewer: "Viewer",
  ai_agent_service: "AI Agent Service",
};

export type RoleOption = {
  value: RoleName;
  label: string;
};

export const roleOptions: RoleOption[] = roleNames.map((value) => ({
  value,
  label: roleLabels[value],
}));

export function formatRoleName(role: string) {
  return roleLabels[role as RoleName] ?? role.replaceAll("_", " ");
}
