import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/features/clients/management/client-detail-loader", () => ({
  loadClientDetail: vi.fn(async () => ({ status: "ready", detail: { clientId: "x" } })),
}));

import { loadClientDetailAction } from "@/features/clients/management/load-client-detail-action";

describe("loadClientDetailAction", () => {
  it("returns error for a non-uuid clientId", async () => {
    const r = await loadClientDetailAction("not-a-uuid");
    expect(r.status).toBe("error");
  });
  it("delegates for a valid uuid", async () => {
    const r = await loadClientDetailAction("22222222-2222-4222-8222-222222222222");
    expect(r.status).toBe("ready");
  });
});
