import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadClientDetail } from "@/features/clients/management/client-detail-loader";

const baseDeps = {
  permissions: ["can_view_clients"],
  fetchPackages: async () => [],
  fetchAppointments: async () => [
    { id: "a1", startsAt: "2026-06-10T02:00:00Z", serviceName: "Reformer", practitionerName: "Dara", status: "completed" },
    { id: "a2", startsAt: "2026-06-20T02:00:00Z", serviceName: "Mat", practitionerName: "Dara", status: "completed" },
    { id: "a3", startsAt: "2026-07-01T02:00:00Z", serviceName: "Mat", practitionerName: "Dara", status: "scheduled" },
  ],
  fetchPaidPayments: async () => [
    { amountIdr: 300000, paidAt: "2026-06-10T03:00:00Z" },
    { amountIdr: 200000, paidAt: "2026-06-20T03:00:00Z" },
  ],
  fetchClinicalCases: async () => [{ id: "c1", title: "Back" }],
};

describe("loadClientDetail", () => {
  it("derives activity from completed appointments", async () => {
    const r = await loadClientDetail("client-1", baseDeps as never);
    expect(r.status).toBe("ready");
    if (r.status !== "ready") return;
    expect(r.detail.activity.totalVisits).toBe(2);
    expect(r.detail.activity.lastVisit).toBe("2026-06-20T02:00:00Z");
    expect(r.detail.appointments).toHaveLength(3);
  });

  it("hides spend without can_view_payments", async () => {
    const r = await loadClientDetail("client-1", baseDeps as never);
    if (r.status !== "ready") throw new Error("expected ready");
    expect(r.detail.spend).toBeNull();
  });

  it("sums spend when permitted", async () => {
    const r = await loadClientDetail("client-1", {
      ...baseDeps,
      permissions: ["can_view_clients", "can_view_payments"],
    } as never);
    if (r.status !== "ready") throw new Error("expected ready");
    expect(r.detail.spend?.totalPaidIdr).toBe(500000);
    expect(r.detail.spend?.lastPaymentAt).toBe("2026-06-20T03:00:00Z");
  });

  it("restricts notes without clinical permission and skips the fetch", async () => {
    let called = false;
    const r = await loadClientDetail("client-1", {
      ...baseDeps,
      fetchClinicalCases: async () => {
        called = true;
        return [];
      },
    } as never);
    if (r.status !== "ready") throw new Error("expected ready");
    expect(r.detail.notes.access).toBe("restricted");
    expect(called).toBe(false);
  });

  it("grants notes with can_view_clinical_cases", async () => {
    const r = await loadClientDetail("client-1", {
      ...baseDeps,
      permissions: ["can_view_clients", "can_view_clinical_cases"],
    } as never);
    if (r.status !== "ready") throw new Error("expected ready");
    expect(r.detail.notes.access).toBe("granted");
  });

  it("returns error when a fetcher throws", async () => {
    const r = await loadClientDetail("client-1", {
      ...baseDeps,
      fetchAppointments: async () => {
        throw new Error("boom");
      },
    } as never);
    expect(r.status).toBe("error");
  });
});
