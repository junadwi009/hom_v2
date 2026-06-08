import { cache } from "react";

import {
  currentUserSchema,
  toShellUser,
  type CurrentUser,
  type ShellUser,
} from "@hom/domain/auth";

import { getAuthBoundary } from "@/lib/auth/boundary";
import { getAuthMode } from "@/lib/env/app-mode";

import { SupabaseAuthBoundaryError } from "./errors";

// Resolve the current user once per server request. RootLayout, the page, and
// any server action in the same render all share this single resolution instead
// of each re-running auth.getUser() + the get_current_app_user_context RPC.
// React's cache() memoizes by call site for the duration of one request.
const resolveCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  return getAuthBoundary().getCurrentUser();
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await resolveCurrentUser();

  if (!user) {
    return null;
  }

  return currentUserSchema.parse(user);
}

export async function getRequiredCurrentUser(): Promise<CurrentUser> {
  const user = await resolveCurrentUser();

  if (!user) {
    throw new SupabaseAuthBoundaryError("AUTH_REQUIRED");
  }

  return currentUserSchema.parse(user);
}

export async function getShellUser(): Promise<ShellUser> {
  return toShellUser(await getRequiredCurrentUser());
}

export async function getOptionalShellUser(): Promise<ShellUser | null> {
  try {
    const user = await getCurrentUser();
    return user ? toShellUser(user) : null;
  } catch (error) {
    if (
      getAuthMode() === "supabase" &&
      error instanceof SupabaseAuthBoundaryError
    ) {
      return null;
    }

    throw error;
  }
}
