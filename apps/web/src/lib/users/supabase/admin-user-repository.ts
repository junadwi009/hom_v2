import "server-only";

import {
  adminUserListResultSchema,
  createAdminUserInputSchema,
  type AdminUserRepository,
  type AdminUserStatus,
  type CreateAdminUserInput,
} from "@hom/domain/users";
import type { RoleName } from "@hom/domain/rbac";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { AdminUserRpcError } from "../errors";
import { mapAdminUserRpcRow } from "./row-mapper";
import type { AdminUserRpcClient, AdminUserRpcResponse } from "./types";

// `supabase` is the authenticated manager's server client (RPCs enforce
// can_manage_users via auth.uid()). Creating the auth identity itself needs the
// service-role Admin API, which is created on demand inside createUser only.
export function createSupabaseAdminUserRepository(
  supabase: AdminUserRpcClient,
): AdminUserRepository {
  return {
    async list() {
      const response = await supabase.rpc("list_app_users");

      if (response.error) {
        throw AdminUserRpcError.fromSupabase(response.error);
      }

      return adminUserListResultSchema.parse({
        items: (response.data ?? []).map(mapAdminUserRpcRow),
      });
    },

    async createUser(input: CreateAdminUserInput) {
      const parsed = createAdminUserInputSchema.parse(input);
      const admin = createSupabaseAdminClient();

      const created = await admin.auth.admin.createUser({
        email: parsed.email,
        password: parsed.password,
        email_confirm: true,
        user_metadata: { full_name: parsed.fullName },
      });

      if (created.error || !created.data.user) {
        throw AdminUserRpcError.fromAuthAdmin(created.error);
      }

      const authUserId = created.data.user.id;

      let response: AdminUserRpcResponse;
      try {
        response = await supabase.rpc("provision_app_user", {
          p_auth_user_id: authUserId,
          p_full_name: parsed.fullName,
          p_email: parsed.email,
          p_role_names: [...parsed.roles],
        });
      } catch (error) {
        await rollbackAuthUser(admin, authUserId);
        throw error;
      }

      if (response.error) {
        await rollbackAuthUser(admin, authUserId);
        throw AdminUserRpcError.fromSupabase(response.error);
      }

      const row = response.data?.[0];
      if (!row) {
        await rollbackAuthUser(admin, authUserId);
        throw new AdminUserRpcError("USER_ADMIN_FAILED");
      }

      return mapAdminUserRpcRow(row);
    },

    async setStatus(id: string, status: AdminUserStatus) {
      const response = await supabase.rpc("set_app_user_status", {
        p_target_user_id: id,
        p_status: status,
      });

      return single(response);
    },

    async setRoles(id: string, roles: readonly RoleName[]) {
      const response = await supabase.rpc("set_app_user_roles", {
        p_target_user_id: id,
        p_role_names: [...roles],
      });

      return single(response);
    },
  };
}

function single(response: AdminUserRpcResponse) {
  if (response.error) {
    throw AdminUserRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];
  if (!row) {
    throw new AdminUserRpcError("USER_ADMIN_FAILED");
  }

  return mapAdminUserRpcRow(row);
}

async function rollbackAuthUser(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  authUserId: string,
) {
  // Best-effort cleanup so a failed provision does not orphan an auth identity.
  try {
    await admin.auth.admin.deleteUser(authUserId);
  } catch {
    // Swallow: the original provisioning error is the one worth surfacing.
  }
}
