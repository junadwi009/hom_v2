import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { ClientRepository } from "@hom/domain/clients";
import type { ClientPackageRepository } from "@hom/domain/packages";

import { loadCreatePaymentOptions } from "../../../src/features/payments/create-payment-options-loader";
import {
  submitCreateManualPaymentFormData,
  toCreateManualPaymentInput,
} from "../../../src/lib/payments/server/submit-create-manual-payment";

function listResult<T>(items: T[]) {
  return { items, total: items.length, page: 1, pageSize: 100 };
}

const clientsRepository = {
  async list() {
    return listResult([
      {
        id: "10000000-0000-4000-8000-000000000001",
        fullName: "Mock Client Alpha",
        status: "active",
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        fullName: "Mock Client Beta",
        status: "prospect",
      },
      {
        id: "10000000-0000-4000-8000-000000000008",
        fullName: "Mock Client Archived",
        status: "archived",
      },
    ]);
  },
  async getById() {
    return null;
  },
} as unknown as ClientRepository;

const clientPackagesRepository = {
  async list() {
    return listResult([
      {
        id: "51000000-0000-4000-8000-000000000001",
        clientId: "10000000-0000-4000-8000-000000000001",
        packageName: "Mock Intro Package",
        status: "active",
      },
      {
        id: "51000000-0000-4000-8000-000000000003",
        clientId: "10000000-0000-4000-8000-000000000002",
        packageName: "Mock 4 Session Pack",
        status: "active",
      },
    ]);
  },
  async getById() {
    return null;
  },
} as unknown as ClientPackageRepository;

describe("loadCreatePaymentOptions", () => {
  it("returns non-archived clients and client package options with client ids", async () => {
    const state = await loadCreatePaymentOptions({
      dataMode: "supabase",
      repositories: {
        clients: clientsRepository,
        clientPackages: clientPackagesRepository,
      },
    });

    expect(state.status).toBe("ready");
    if (state.status !== "ready") {
      throw new Error("expected ready state");
    }
    expect(state.options.clients.map((client) => client.label)).toEqual([
      "Mock Client Alpha",
      "Mock Client Beta",
    ]);
    expect(state.options.clientPackages).toHaveLength(2);
    expect(state.options.clientPackages[0]).toMatchObject({
      clientId: "10000000-0000-4000-8000-000000000001",
    });
    expect(JSON.stringify(state.options)).not.toMatch(
      /phone|email|payment|clinical|whatsapp|contact|card/i,
    );
  });
});

describe("submitCreateManualPaymentFormData", () => {
  function formData(values: Record<string, string>) {
    const data = new FormData();
    for (const [key, value] of Object.entries(values)) {
      data.set(key, value);
    }
    return data;
  }

  const pendingValues = {
    clientId: "10000000-0000-4000-8000-000000000001",
    amountIdr: "750000",
    paymentMethod: "cash",
    status: "pending",
  };

  it("does not fake persistence in mock mode", async () => {
    const createPayment = vi.fn();

    const result = await submitCreateManualPaymentFormData(
      formData(pendingValues),
      { dataMode: "mock", authMode: "mock", createPayment },
    );

    expect(result.status).toBe("configuration_error");
    expect(createPayment).not.toHaveBeenCalled();
  });

  it("creates a pending payment without a paid date and returns a safe success", async () => {
    const createPayment = vi.fn(async () => ({
      id: "60000000-0000-4000-8000-0000000000aa",
    })) as never;

    const result = await submitCreateManualPaymentFormData(
      formData({ ...pendingValues, paidAtLocal: "2026-06-03T09:00" }),
      { dataMode: "supabase", authMode: "supabase", createPayment },
    );

    expect(result).toMatchObject({
      status: "success",
      paymentId: "60000000-0000-4000-8000-0000000000aa",
    });
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", paidAt: undefined }),
    );
  });

  it("creates a paid payment with a converted paid date", async () => {
    const createPayment = vi.fn(async () => ({
      id: "60000000-0000-4000-8000-0000000000bb",
    })) as never;

    await submitCreateManualPaymentFormData(
      formData({
        clientId: "10000000-0000-4000-8000-000000000001",
        clientPackageId: "51000000-0000-4000-8000-000000000001",
        amountIdr: "750000",
        paymentMethod: "bank_transfer",
        status: "paid",
        paidAtLocal: "2026-06-03T09:00",
      }),
      { dataMode: "supabase", authMode: "supabase", createPayment },
    );

    const input = (createPayment as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(input.status).toBe("paid");
    expect(input.clientPackageId).toBe(
      "51000000-0000-4000-8000-000000000001",
    );
    expect(typeof input.paidAt).toBe("string");
  });

  it("rejects a paid payment without a paid date", async () => {
    const createPayment = vi.fn();

    const result = await submitCreateManualPaymentFormData(
      formData({
        clientId: "10000000-0000-4000-8000-000000000001",
        amountIdr: "750000",
        paymentMethod: "cash",
        status: "paid",
      }),
      { dataMode: "supabase", authMode: "supabase", createPayment },
    );

    expect(result.status).toBe("validation_error");
    expect(createPayment).not.toHaveBeenCalled();
  });

  it("rejects a non-positive amount", async () => {
    const result = await submitCreateManualPaymentFormData(
      formData({ ...pendingValues, amountIdr: "0" }),
      { dataMode: "supabase", authMode: "supabase", createPayment: vi.fn() },
    );

    expect(result.status).toBe("validation_error");
  });

  it("rejects card, bank, and gateway secret content in notes or reference", async () => {
    const withCardNotes = await submitCreateManualPaymentFormData(
      formData({ ...pendingValues, notes: "card 4111 1111 1111 1111" }),
      { dataMode: "supabase", authMode: "supabase", createPayment: vi.fn() },
    );
    const withTokenReference = await submitCreateManualPaymentFormData(
      formData({ ...pendingValues, referenceNumber: "sk_live_abcdef123456" }),
      { dataMode: "supabase", authMode: "supabase", createPayment: vi.fn() },
    );

    expect(withCardNotes.status).toBe("validation_error");
    expect(withTokenReference.status).toBe("validation_error");
  });

  it("clears the paid date for a pending payment in toCreateManualPaymentInput", () => {
    const data = new FormData();
    data.set("clientId", "10000000-0000-4000-8000-000000000001");
    data.set("amountIdr", "500000");
    data.set("paymentMethod", "cash");
    data.set("status", "pending");
    data.set("paidAtLocal", "2026-06-03T09:00");

    const input = toCreateManualPaymentInput(data);

    expect(input.status).toBe("pending");
    expect(input.paidAt).toBeUndefined();
  });
});
