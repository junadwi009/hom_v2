import {
  createMockAdminUserRepository,
  type AdminUserRepository,
} from "@hom/domain/users";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createSupabaseAdminUserRepository } from "./supabase/admin-user-repository";
import type { AdminUserRpcClient } from "./supabase/types";

type CreateAdminUserRepositoryOptions = {
  createSupabaseClient?: () => Promise<AdminUserRpcClient>;
};

export async function createAdminUserRepository(
  options: CreateAdminUserRepositoryOptions = {},
): Promise<AdminUserRepository> {
  if (getDataMode() !== "supabase") {
    return createMockAdminUserRepository();
  }

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createAdminUserRpcClient();

  return createSupabaseAdminUserRepository(supabase);
}

async function createAdminUserRpcClient(): Promise<AdminUserRpcClient> {
  return (await createSupabaseServerClient()) as unknown as AdminUserRpcClient;
}
