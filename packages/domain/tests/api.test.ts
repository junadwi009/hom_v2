import { describe, expect, it } from "vitest";

import {
  apiError,
  apiErrorCodeSchema,
  apiErrorResponseSchema,
  apiSuccess,
} from "../src/api";

describe("API response helpers", () => {
  it("creates standard success responses", () => {
    expect(apiSuccess({ userId: "user-1" }, { authMode: "mock" })).toEqual({
      ok: true,
      data: { userId: "user-1" },
      meta: { authMode: "mock" },
    });
  });

  it("creates standard error responses", () => {
    expect(
      apiError({
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
      },
    });
  });

  it("includes NOT_IMPLEMENTED as an approved error code", () => {
    const response = apiError({
      code: "NOT_IMPLEMENTED",
      message: "This capability is not enabled yet.",
    });

    expect(apiErrorCodeSchema.safeParse("NOT_IMPLEMENTED").success).toBe(true);
    expect(apiErrorResponseSchema.safeParse(response).success).toBe(true);
    expect(response.error.code).toBe("NOT_IMPLEMENTED");
  });
});
