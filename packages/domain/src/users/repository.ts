import type { RoleName } from "../rbac";
import type {
  AdminUser,
  AdminUserListResult,
  AdminUserStatus,
  CreateAdminUserInput,
} from "./types";

export type AdminUserRepository = {
  list(): Promise<AdminUserListResult>;
  createUser(input: CreateAdminUserInput): Promise<AdminUser>;
  setStatus(id: string, status: AdminUserStatus): Promise<AdminUser>;
  setRoles(id: string, roles: readonly RoleName[]): Promise<AdminUser>;
};
