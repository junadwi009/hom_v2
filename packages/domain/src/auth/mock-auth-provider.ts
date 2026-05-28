import { getPermissionsForRoles } from "../rbac/role-permissions";
import type { AuthBoundary, CurrentUser } from "./types";

export const mockStudioDirectorUser: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  authUserId: null,
  email: "owner@example.local",
  fullName: "Studio Director",
  status: "active",
  roles: ["studio_director"],
  permissions: getPermissionsForRoles(["studio_director"]),
};

export function createMockAuthBoundary(
  user: CurrentUser | null = mockStudioDirectorUser,
): AuthBoundary {
  return {
    async getCurrentUser() {
      return user;
    },
    async requireAuthenticatedUser() {
      if (!user) {
        throw new Error("Authentication is required");
      }

      return user;
    },
  };
}
