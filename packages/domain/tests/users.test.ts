import { describe, expect, it } from "vitest";

import {
  adminUserSchema,
  adminUserStatusSchema,
  createAdminUserInputSchema,
  createMockAdminUserRepository,
  mockAdminUsers,
} from "../src/users";

describe("admin user schemas", () => {
  it("accepts only canonical statuses", () => {
    expect(adminUserStatusSchema.safeParse("active").success).toBe(true);
    expect(adminUserStatusSchema.safeParse("deleted").success).toBe(false);
  });

  it("requires a valid email and at least one role on create", () => {
    expect(
      createAdminUserInputSchema.safeParse({
        fullName: "New User",
        email: "new.user@example.invalid",
        password: "supersecret",
        roles: ["admin_frontdesk"],
      }).success,
    ).toBe(true);

    expect(
      createAdminUserInputSchema.safeParse({
        fullName: "New User",
        email: "not-an-email",
        password: "supersecret",
        roles: ["admin_frontdesk"],
      }).success,
    ).toBe(false);

    expect(
      createAdminUserInputSchema.safeParse({
        fullName: "New User",
        email: "new.user@example.invalid",
        password: "short",
        roles: ["admin_frontdesk"],
      }).success,
    ).toBe(false);

    expect(
      createAdminUserInputSchema.safeParse({
        fullName: "New User",
        email: "new.user@example.invalid",
        password: "supersecret",
        roles: [],
      }).success,
    ).toBe(false);
  });

  it("validates the seeded mock users", () => {
    for (const user of mockAdminUsers) {
      expect(adminUserSchema.safeParse(user).success).toBe(true);
    }
  });
});

describe("mock admin user repository", () => {
  it("lists seeded users sorted by name", async () => {
    const repo = createMockAdminUserRepository();
    const result = await repo.list();
    expect(result.items.length).toBe(mockAdminUsers.length);
    const names = result.items.map((user) => user.fullName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("creates, restatuses, and reroles users", async () => {
    const repo = createMockAdminUserRepository();

    const created = await repo.createUser({
      fullName: "Created User",
      email: "Created.User@example.invalid",
      password: "supersecret",
      roles: ["viewer"],
    });
    expect(created.email).toBe("created.user@example.invalid");
    expect(created.status).toBe("active");
    expect((await repo.list()).items.length).toBe(mockAdminUsers.length + 1);

    const suspended = await repo.setStatus(created.id, "suspended");
    expect(suspended.status).toBe("suspended");

    const rerolled = await repo.setRoles(created.id, ["finance_admin"]);
    expect(rerolled.roles).toEqual(["finance_admin"]);
  });

  it("throws when the target user is missing", async () => {
    const repo = createMockAdminUserRepository();
    await expect(
      repo.setStatus("00000000-0000-4000-8000-0000000000ff", "inactive"),
    ).rejects.toThrow("APP_USER_NOT_FOUND");
  });
});
