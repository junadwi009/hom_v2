import "server-only";

import type { AdminUser } from "@hom/domain/users";

import { getDataMode } from "@/lib/env/app-mode";
import { createAdminUserRepository } from "@/lib/users/repository-factory";

export type UsersPageState =
  | { status: "ready"; dataMode: "mock" | "supabase"; users: AdminUser[] }
  | { status: "error"; dataMode: "mock" | "supabase" };

export async function loadUsersPage(): Promise<UsersPageState> {
  const dataMode = getDataMode();

  try {
    const repository = await createAdminUserRepository();
    const result = await repository.list();
    return { status: "ready", dataMode, users: result.items };
  } catch {
    return { status: "error", dataMode };
  }
}
