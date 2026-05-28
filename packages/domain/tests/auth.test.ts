import { describe, expect, it } from "vitest";

import {
  authModeSchema,
  createMockAuthBoundary,
  currentUserSchema,
  getInitials,
  getRoleLabel,
  mockStudioDirectorUser,
  toShellUser,
} from "../src/auth";
import { hasPermission } from "../src/rbac";

describe("auth schemas and mock boundary", () => {
  it("accepts approved auth modes only", () => {
    expect(authModeSchema.safeParse("mock").success).toBe(true);
    expect(authModeSchema.safeParse("supabase").success).toBe(true);
    expect(authModeSchema.safeParse("production").success).toBe(false);
  });

  it("keeps the mock studio director user valid", () => {
    expect(currentUserSchema.safeParse(mockStudioDirectorUser).success).toBe(
      true,
    );
    expect(hasPermission(mockStudioDirectorUser, "can_manage_knowledge")).toBe(
      true,
    );
    expect(
      hasPermission(mockStudioDirectorUser, "can_manage_roles_permissions"),
    ).toBe(false);
  });

  it("returns the mock user through the auth boundary", async () => {
    const auth = createMockAuthBoundary();

    await expect(auth.getCurrentUser()).resolves.toEqual(
      mockStudioDirectorUser,
    );
    await expect(auth.requireAuthenticatedUser()).resolves.toEqual(
      mockStudioDirectorUser,
    );
  });

  it("throws when an unauthenticated mock boundary requires a user", async () => {
    const auth = createMockAuthBoundary(null);

    await expect(auth.getCurrentUser()).resolves.toBeNull();
    await expect(auth.requireAuthenticatedUser()).rejects.toThrow(
      "Authentication is required",
    );
  });

  it("maps the current user into a safe shell display model", () => {
    expect(toShellUser(mockStudioDirectorUser)).toEqual({
      fullName: "Studio Director",
      email: "owner@example.local",
      initials: "SD",
      roleLabel: "Studio Director",
    });
  });

  it("derives readable initials and role labels", () => {
    expect(getInitials("HOM Owner")).toBe("HO");
    expect(getInitials("Admin")).toBe("AD");
    expect(getRoleLabel(["admin_frontdesk"])).toBe("Admin Front Desk");
    expect(getRoleLabel([])).toBe("No assigned role");
  });
});
