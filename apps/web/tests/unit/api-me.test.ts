import { apiErrorResponseSchema } from "@hom/domain/api";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../../src/app/api/me/route";

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
  });

  it("returns a safe NOT_IMPLEMENTED response for Supabase auth mode", async () => {
    vi.stubEnv("HOM_AUTH_MODE", "supabase");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(501);
    expect(apiErrorResponseSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual({
      ok: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message:
          "Supabase auth mode is not enabled in Phase 3A. Keep HOM_AUTH_MODE=mock until real auth is approved.",
      },
    });
  });
});
