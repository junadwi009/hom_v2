import {
  currentUserSchema,
  toShellUser,
  type CurrentUser,
  type ShellUser,
} from "@hom/domain/auth";

import { getAuthBoundary } from "@/lib/auth/boundary";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const user = await getAuthBoundary().getCurrentUser();

  if (!user) {
    return null;
  }

  return currentUserSchema.parse(user);
}

export async function getRequiredCurrentUser(): Promise<CurrentUser> {
  return currentUserSchema.parse(
    await getAuthBoundary().requireAuthenticatedUser(),
  );
}

export async function getShellUser(): Promise<ShellUser> {
  return toShellUser(await getRequiredCurrentUser());
}
