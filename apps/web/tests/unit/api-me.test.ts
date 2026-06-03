import { apiErrorResponseSchema } from "@hom/domain/api";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  GET,
  getMeResponse,
} from "../../src/app/api/me/route";
import { SupabaseAuthBoundaryError } from "../../src/lib/auth/errors";

describe("GET /api/me", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the mock Studio Director in mock auth mode", async () => {
    vi.stubEnv("HOM_AUTH_MODE", "mock");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: {
        user: {
          fullName: "Studio Director",
          email: "owner@example.local",
          roles: ["studio_director"],
        },
      },
      meta: {
        authMode: "mock",
      },
    });
    expect(body.data.user.permissions).toContain("can_manage_knowledge");
    expect(body.data.user.permissions).toContain("can_manage_client_packages");
  });

  it("returns the mapped local user safely in Supabase auth mode", async () => {
    vi.stubEnv("HOM_AUTH_MODE", "supabase");

    const response = await getMeResponse({
      loadCurrentUser: async () => ({
        id: "94000000-0000-4000-8000-000000000001",
        authUserId: "93000000-0000-4000-8000-000000000001",
        fullName: "Local Studio Director",
        email: "local.studio.director@example.invalid",
        status: "active",
        roles: ["studio_director"],
        permissions: ["can_manage_appointments", "can_manage_client_packages"],
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.user).toMatchObject({
      fullName: "Local Studio Director",
      roles: ["studio_director"],
      permissions: ["can_manage_appointments", "can_manage_client_packages"],
    });
    expect(body.meta.authMode).toBe("supabase");
  });

  it("returns a safe unauthorized response when the Supabase session is missing", async () => {
    vi.stubEnv("HOM_AUTH_MODE", "supabase");

    const response = await getMeResponse({
      loadCurrentUser: async () => null,
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
      },
    });
  });

  it("returns a safe forbidden response for an inactive app user", async () => {
    vi.stubEnv("HOM_AUTH_MODE", "supabase");

    const response = await getMeResponse({
      loadCurrentUser: async () => {
        throw new SupabaseAuthBoundaryError("APP_USER_INACTIVE");
      },
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Your studio profile is not active.",
      },
    });
  });
});
