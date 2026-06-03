import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createSupabaseAuthBoundary } from "../../../src/lib/auth/supabase-auth-boundary";
import { SupabaseAuthBoundaryError } from "../../../src/lib/auth/errors";

const mappedContext = {
  id: "94000000-0000-4000-8000-000000000001",
  auth_user_id: "93000000-0000-4000-8000-000000000001",
  full_name: "Local Studio Director",
  email: "local.studio.director@example.invalid",
  status: "active",
  roles: ["studio_director"],
  permissions: ["can_manage_appointments"],
};

describe("Supabase auth boundary", () => {
  it("loads the mapped current user and permissions from the context RPC", async () => {
    const rpc = vi.fn(async () => ({
      data: [mappedContext],
      error: null,
    }));
    const boundary = createSupabaseAuthBoundary({
      createSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: { id: mappedContext.auth_user_id } },
            error: null,
          }),
        },
        rpc,
      }),
    });

    await expect(boundary.requireAuthenticatedUser()).resolves.toMatchObject({
      fullName: "Local Studio Director",
      roles: ["studio_director"],
      permissions: ["can_manage_appointments"],
    });
    expect(rpc).toHaveBeenCalledWith("get_current_app_user_context");
  });

  it("returns null for a missing session and rejects a required session safely", async () => {
    const boundary = createSupabaseAuthBoundary({
      createSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: null,
          }),
        },
        rpc: vi.fn(),
      }),
    });

    await expect(boundary.getCurrentUser()).resolves.toBeNull();
    await expect(boundary.requireAuthenticatedUser()).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
    });
  });

  it("maps an inactive app user error without exposing database details", async () => {
    const boundary = createSupabaseAuthBoundary({
      createSupabaseClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: { id: mappedContext.auth_user_id } },
            error: null,
          }),
        },
        rpc: async () => ({
          data: null,
          error: { message: "APP_USER_INACTIVE: raw details stay hidden" },
        }),
      }),
    });

    await expect(boundary.requireAuthenticatedUser()).rejects.toEqual(
      new SupabaseAuthBoundaryError("APP_USER_INACTIVE"),
    );
  });
});
