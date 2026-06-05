import type { CurrentUser } from "@hom/domain/auth";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { submitAiDemoSummary } from "../../../src/lib/ai/submit-ai-demo-summary";
import type { AiDemoSummaryState } from "../../../src/lib/ai/ai-demo-types";

function userWith(permissions: CurrentUser["permissions"]): CurrentUser {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    authUserId: "22222222-2222-4222-8222-222222222222",
    email: "director@example.com",
    fullName: "Demo Director",
    status: "active",
    roles: ["super_admin"],
    permissions,
  };
}

const disabledResult: AiDemoSummaryState = { status: "disabled" };

describe("submit ai demo summary", () => {
  it("returns unavailable when not authenticated and never generates", async () => {
    const generate = vi.fn(async () => disabledResult);

    const result = await submitAiDemoSummary({
      loadCurrentUser: async () => null,
      generate,
    });

    expect(result).toEqual({
      status: "unavailable",
      message: "AI demo unavailable",
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it("returns unavailable when the user lacks an operational view permission", async () => {
    const generate = vi.fn(async () => disabledResult);

    const result = await submitAiDemoSummary({
      loadCurrentUser: async () => userWith(["can_manage_clients"]),
      generate,
    });

    expect(result).toEqual({
      status: "unavailable",
      message: "AI demo unavailable",
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it("delegates to generate when the user can view appointments", async () => {
    const generate = vi.fn(async () => disabledResult);

    const result = await submitAiDemoSummary({
      loadCurrentUser: async () => userWith(["can_view_appointments"]),
      generate,
    });

    expect(result).toEqual(disabledResult);
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("returns unavailable safely when loading the user throws", async () => {
    const generate = vi.fn(async () => disabledResult);

    const result = await submitAiDemoSummary({
      loadCurrentUser: async () => {
        throw new Error("boundary boom");
      },
      generate,
    });

    expect(result).toEqual({
      status: "unavailable",
      message: "AI demo unavailable",
    });
    expect(generate).not.toHaveBeenCalled();
  });
});
