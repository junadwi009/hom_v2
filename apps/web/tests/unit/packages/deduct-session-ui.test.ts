import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type {
  ClientPackage,
  ClientPackageRepository,
  PackageUsageHistory,
  PackageUsageHistoryRepository,
} from "@hom/domain/packages";

import {
  filterEligibleDeductPackages,
  loadDeductSessionOptions,
} from "../../../src/features/appointments/deduct-session-options-loader";
import { toDeductSessionPreview } from "../../../src/features/appointments/deduct-session-types";
import {
  submitDeductSessionFormData,
  toSafeDeductSessionActionState,
} from "../../../src/lib/packages/server/submit-deduct-session";
import { DeductClientPackageSessionRpcError } from "../../../src/lib/packages/server/deduct-client-package-session";

const NOW = new Date("2026-06-03T00:00:00.000Z");
const APPOINTMENT_ID = "40000000-0000-4000-8000-000000000003";
const CLIENT_ID = "10000000-0000-4000-8000-000000000001";

function clientPackage(overrides: Partial<ClientPackage> = {}): ClientPackage {
  return {
    id: "51000000-0000-4000-8000-000000000001",
    clientId: CLIENT_ID,
    clientName: "Mock Client Alpha",
    packageId: "50000000-0000-4000-8000-000000000001",
    packageName: "Mock Intro Package",
    purchasedAt: "2026-06-01T02:00:00.000Z",
    expiresAt: "2026-07-01T02:00:00.000Z",
    totalSessions: 2,
    remainingSessions: 2,
    status: "active",
    createdAt: "2026-06-01T02:00:00.000Z",
    updatedAt: "2026-06-01T02:00:00.000Z",
    ...overrides,
  };
}

function createRepositories(options: {
  clientPackages: ClientPackage[];
  usage: PackageUsageHistory[];
}) {
  const clientPackages: ClientPackageRepository = {
    async list() {
      return {
        items: options.clientPackages,
        total: options.clientPackages.length,
        page: 1,
        pageSize: 100,
      };
    },
    async getById() {
      return null;
    },
  };
  const packageUsageHistory: PackageUsageHistoryRepository = {
    async list() {
      return {
        items: options.usage,
        total: options.usage.length,
        page: 1,
        pageSize: 100,
      };
    },
    async getById() {
      return null;
    },
  };

  return { clientPackages, packageUsageHistory };
}

describe("filterEligibleDeductPackages", () => {
  it("keeps only active, in-credit, non-expired packages for the client", () => {
    const packages = [
      clientPackage({ id: "a" }),
      clientPackage({ id: "b", status: "depleted", remainingSessions: 0 }),
      clientPackage({ id: "c", status: "expired" }),
      clientPackage({ id: "d", remainingSessions: 0 }),
      clientPackage({ id: "e", expiresAt: "2026-05-01T02:00:00.000Z" }),
      clientPackage({ id: "f", clientId: "10000000-0000-4000-8000-000000000099" }),
    ];

    const eligible = filterEligibleDeductPackages(packages, CLIENT_ID, NOW);

    expect(eligible.map((item) => item.id)).toEqual(["a"]);
  });
});

describe("toDeductSessionPreview", () => {
  it("shows one fewer remaining session and never goes below zero", () => {
    expect(toDeductSessionPreview(2)).toEqual({ before: 2, after: 1 });
    expect(toDeductSessionPreview(1)).toEqual({ before: 1, after: 0 });
    expect(toDeductSessionPreview(0)).toEqual({ before: 0, after: 0 });
  });
});

describe("loadDeductSessionOptions", () => {
  it("returns eligible packages and no sensitive fields", async () => {
    const repositories = createRepositories({
      clientPackages: [clientPackage()],
      usage: [],
    });

    const state = await loadDeductSessionOptions(
      { appointmentId: APPOINTMENT_ID, clientId: CLIENT_ID },
      { repositories, dataMode: "supabase", now: NOW },
    );

    expect(state.status).toBe("ready");
    if (state.status !== "ready") {
      throw new Error("expected ready state");
    }
    expect(state.alreadyDeducted).toBe(false);
    expect(state.packages).toHaveLength(1);
    expect(Object.keys(state.packages[0]).sort()).toEqual(
      ["expiresAt", "id", "packageName", "remainingSessions", "totalSessions"],
    );
  });

  it("flags already deducted when a deducted usage row exists for the appointment", async () => {
    const repositories = createRepositories({
      clientPackages: [clientPackage()],
      usage: [
        {
          id: "52000000-0000-4000-8000-000000000001",
          clientPackageId: "51000000-0000-4000-8000-000000000001",
          appointmentId: APPOINTMENT_ID,
          changeType: "deducted",
          quantity: 1,
          beforeRemaining: 2,
          afterRemaining: 1,
          createdAt: "2026-06-03T02:00:00.000Z",
        },
      ],
    });

    const state = await loadDeductSessionOptions(
      { appointmentId: APPOINTMENT_ID, clientId: CLIENT_ID },
      { repositories, dataMode: "supabase", now: NOW },
    );

    if (state.status !== "ready") {
      throw new Error("expected ready state");
    }
    expect(state.alreadyDeducted).toBe(true);
  });

  it("ignores deducted usage rows from other appointments", async () => {
    const repositories = createRepositories({
      clientPackages: [clientPackage()],
      usage: [
        {
          id: "52000000-0000-4000-8000-000000000002",
          clientPackageId: "51000000-0000-4000-8000-000000000001",
          appointmentId: "40000000-0000-4000-8000-000000000099",
          changeType: "deducted",
          quantity: 1,
          beforeRemaining: 2,
          afterRemaining: 1,
          createdAt: "2026-06-03T02:00:00.000Z",
        },
      ],
    });

    const state = await loadDeductSessionOptions(
      { appointmentId: APPOINTMENT_ID, clientId: CLIENT_ID },
      { repositories, dataMode: "supabase", now: NOW },
    );

    if (state.status !== "ready") {
      throw new Error("expected ready state");
    }
    expect(state.alreadyDeducted).toBe(false);
  });
});

describe("submitDeductSessionFormData", () => {
  function formData(values: Record<string, string>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(values)) {
      data.set(key, value);
    }
    return data;
  }

  const validValues = {
    appointmentId: APPOINTMENT_ID,
    clientPackageId: "51000000-0000-4000-8000-000000000001",
  };

  it("does not fake persistence in mock mode", async () => {
    const deductSession = vi.fn();

    const result = await submitDeductSessionFormData(formData(validValues), {
      dataMode: "mock",
      authMode: "mock",
      deductSession,
    });

    expect(result.status).toBe("configuration_error");
    expect(deductSession).not.toHaveBeenCalled();
  });

  it("deducts in supabase mode and returns a safe success state", async () => {
    const deductSession = vi.fn(async () => ({
      id: "51000000-0000-4000-8000-000000000001",
      clientId: CLIENT_ID,
      clientName: "Mock Client Alpha",
      packageId: "50000000-0000-4000-8000-000000000001",
      packageName: "Mock Intro Package",
      purchasedAt: "2026-06-01T02:00:00.000Z",
      expiresAt: "2026-07-01T02:00:00.000Z",
      totalSessions: 2,
      remainingSessions: 1,
      status: "active" as const,
      createdAt: "2026-06-01T02:00:00.000Z",
      updatedAt: "2026-06-03T02:00:00.000Z",
    }));

    const result = await submitDeductSessionFormData(formData(validValues), {
      dataMode: "supabase",
      authMode: "supabase",
      deductSession,
    });

    expect(result).toMatchObject({
      status: "success",
      clientPackageId: "51000000-0000-4000-8000-000000000001",
    });
    expect(deductSession).toHaveBeenCalledWith({
      appointmentId: APPOINTMENT_ID,
      clientPackageId: "51000000-0000-4000-8000-000000000001",
    });
  });

  it("maps invalid form input to a validation error", async () => {
    const result = await submitDeductSessionFormData(
      formData({ appointmentId: "", clientPackageId: "" }),
      { dataMode: "supabase", authMode: "supabase", deductSession: vi.fn() },
    );

    expect(result.status).toBe("validation_error");
  });

  it("maps known RPC errors to safe action states", () => {
    expect(
      toSafeDeductSessionActionState(
        new DeductClientPackageSessionRpcError("ALREADY_DEDUCTED"),
      ).status,
    ).toBe("already_deducted");
    expect(
      toSafeDeductSessionActionState(
        new DeductClientPackageSessionRpcError("CLIENT_PACKAGE_UNAVAILABLE"),
      ).status,
    ).toBe("package_unavailable");
    expect(
      toSafeDeductSessionActionState(
        new DeductClientPackageSessionRpcError("APPOINTMENT_NOT_COMPLETED"),
      ).status,
    ).toBe("appointment_not_completed");
  });
});
