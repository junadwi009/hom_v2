import type { RoleName } from "../rbac";
import type { CurrentUser } from "./types";

export type ShellUser = {
  fullName: string;
  email: string;
  initials: string;
  roleLabel: string;
};

const roleLabels = {
  super_admin: "Super Admin",
  studio_director: "Studio Director",
  admin_frontdesk: "Admin Front Desk",
  practitioner: "Practitioner",
  finance_admin: "Finance Admin",
  marketing_admin: "Marketing Admin",
  viewer: "Viewer",
  ai_agent_service: "AI Agent Service",
} as const satisfies Record<RoleName, string>;

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  }

  return (words[0] ?? "?").slice(0, 2).toUpperCase();
}

export function getRoleLabel(roles: readonly RoleName[]): string {
  const primaryRole = roles[0];

  if (!primaryRole) {
    return "No assigned role";
  }

  return roleLabels[primaryRole];
}

export function toShellUser(user: CurrentUser): ShellUser {
  return {
    fullName: user.fullName,
    email: user.email,
    initials: getInitials(user.fullName),
    roleLabel: getRoleLabel(user.roles),
  };
}
