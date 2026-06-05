import { adminUserSchema, type AdminUser } from "@hom/domain/users";

import type { AdminUserRpcRow } from "./types";

export function mapAdminUserRpcRow(row: AdminUserRpcRow): AdminUser {
  return adminUserSchema.parse({
    id: row.id,
    authUserId: row.auth_user_id,
    fullName: row.full_name,
    email: row.email,
    status: row.status,
    roles: row.roles ?? [],
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
