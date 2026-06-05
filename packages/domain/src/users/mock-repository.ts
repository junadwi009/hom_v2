import type { RoleName } from "../rbac";
import {
  adminUserListResultSchema,
  adminUserSchema,
  createAdminUserInputSchema,
} from "./schemas";
import type { AdminUserRepository } from "./repository";
import type { AdminUser, AdminUserStatus, CreateAdminUserInput } from "./types";

export const mockAdminUsers = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    authUserId: "93000000-0000-4000-8000-000000000001",
    fullName: "Local Studio Director",
    email: "local.studio.director@example.invalid",
    status: "active",
    roles: ["studio_director"],
    createdAt: "2026-05-26T01:00:00.000Z",
    updatedAt: "2026-05-26T01:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    authUserId: "93000000-0000-4000-8000-000000000002",
    fullName: "Mock Front Desk",
    email: "frontdesk@example.invalid",
    status: "active",
    roles: ["admin_frontdesk"],
    createdAt: "2026-05-26T02:00:00.000Z",
    updatedAt: "2026-05-26T02:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    authUserId: "93000000-0000-4000-8000-000000000003",
    fullName: "Mock Finance Admin",
    email: "finance@example.invalid",
    status: "suspended",
    roles: ["finance_admin"],
    createdAt: "2026-05-26T03:00:00.000Z",
    updatedAt: "2026-05-26T03:00:00.000Z",
  },
] as const satisfies readonly AdminUser[];

export function createMockAdminUserRepository(
  seed: readonly AdminUser[] = mockAdminUsers,
): AdminUserRepository {
  const users: AdminUser[] = seed.map((user) => adminUserSchema.parse(user));

  function findOrThrow(id: string): AdminUser {
    const user = users.find((candidate) => candidate.id === id);
    if (!user) {
      throw new Error("APP_USER_NOT_FOUND");
    }
    return user;
  }

  return {
    async list() {
      return adminUserListResultSchema.parse({
        items: [...users].sort((a, b) => a.fullName.localeCompare(b.fullName)),
      });
    },
    async createUser(input: CreateAdminUserInput) {
      const parsed = createAdminUserInputSchema.parse(input);
      const now = new Date().toISOString();
      const user = adminUserSchema.parse({
        id: crypto.randomUUID(),
        authUserId: crypto.randomUUID(),
        fullName: parsed.fullName,
        email: parsed.email.toLowerCase(),
        status: "active",
        roles: parsed.roles,
        createdAt: now,
        updatedAt: now,
      });
      users.push(user);
      return user;
    },
    async setStatus(id: string, status: AdminUserStatus) {
      const user = findOrThrow(id);
      const next = adminUserSchema.parse({
        ...user,
        status,
        updatedAt: new Date().toISOString(),
      });
      users[users.indexOf(user)] = next;
      return next;
    },
    async setRoles(id: string, roles: readonly RoleName[]) {
      const user = findOrThrow(id);
      const next = adminUserSchema.parse({
        ...user,
        roles: [...roles],
        updatedAt: new Date().toISOString(),
      });
      users[users.indexOf(user)] = next;
      return next;
    },
  };
}
