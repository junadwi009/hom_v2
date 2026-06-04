import { describe, expect, it } from "vitest";

import {
  cancelPaymentInputSchema,
  createManualPaymentInputSchema,
  createMockPaymentRepository,
  createMockPaymentStatusHistoryRepository,
  createPaymentStatusSchema,
  markPaymentPaidInputSchema,
  mockPayments,
  mockPaymentStatusHistory,
  paymentMethodSchema,
  paymentSchema,
  paymentStatusHistorySchema,
  paymentStatusSchema,
} from "../src/payments";

const basePayment = {
  id: "60000000-0000-4000-8000-000000000001",
  clientId: "10000000-0000-4000-8000-000000000001",
  clientName: "Mock Client Alpha",
  amountIdr: 750000,
  paymentMethod: "cash" as const,
  status: "paid" as const,
  createdAt: "2026-06-03T02:00:00.000Z",
  updatedAt: "2026-06-03T02:05:00.000Z",
};

describe("payment enums", () => {
  it("accepts the approved payment statuses", () => {
    for (const status of ["pending", "paid", "failed", "refunded", "cancelled"]) {
      expect(paymentStatusSchema.parse(status)).toBe(status);
    }
    expect(() => paymentStatusSchema.parse("settled")).toThrow();
  });

  it("accepts the approved payment methods", () => {
    for (const method of ["cash", "bank_transfer", "card", "e_wallet", "other"]) {
      expect(paymentMethodSchema.parse(method)).toBe(method);
    }
    expect(() => paymentMethodSchema.parse("crypto")).toThrow();
  });
});

describe("paymentSchema validation", () => {
  it("accepts a safe payment read model", () => {
    expect(() => paymentSchema.parse(basePayment)).not.toThrow();
  });

  it("requires a positive amountIdr", () => {
    expect(() => paymentSchema.parse({ ...basePayment, amountIdr: 0 })).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, amountIdr: -100 }),
    ).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, amountIdr: 1000.5 }),
    ).toThrow();
  });

  it("does not use cents naming", () => {
    expect(Object.keys(paymentSchema.shape)).toContain("amountIdr");
    expect(Object.keys(paymentSchema.shape)).not.toContain("amountCents");
    expect(Object.keys(paymentSchema.shape)).not.toContain("amount_cents");
  });

  it("limits notes to 280 characters", () => {
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "a".repeat(280) }),
    ).not.toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "a".repeat(281) }),
    ).toThrow();
  });

  it("rejects card numbers", () => {
    expect(() =>
      paymentSchema.parse({
        ...basePayment,
        referenceNumber: "4111 1111 1111 1111",
      }),
    ).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "card 4111111111111111" }),
    ).toThrow();
  });

  it("rejects bank account numbers and secrets", () => {
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "account 1234567890123" }),
    ).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "cvv 123 card number" }),
    ).toThrow();
  });

  it("rejects gateway tokens and API keys", () => {
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "sk_live_abcdef123456" }),
    ).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "api_key: zzzz" }),
    ).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, referenceNumber: "sk-abcdefgh12" }),
    ).toThrow();
  });

  it("rejects contact, clinical, and WhatsApp content", () => {
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "email a@b.com" }),
    ).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "call +62 812 3456 7890" }),
    ).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "diagnosis noted" }),
    ).toThrow();
    expect(() =>
      paymentSchema.parse({ ...basePayment, notes: "whatsapp message sent" }),
    ).toThrow();
  });

  it("rejects unknown keys", () => {
    expect(() =>
      paymentSchema.parse({ ...basePayment, cardNumber: "4111111111111111" }),
    ).toThrow();
  });

  it("allows ordinary operational notes", () => {
    expect(() =>
      paymentSchema.parse({
        ...basePayment,
        notes: "Cash received at front desk via bank transfer follow-up.",
        referenceNumber: "MOCK-REF-0001",
      }),
    ).not.toThrow();
  });
});

describe("paymentStatusHistorySchema", () => {
  it("accepts a safe status history row and rejects unknown keys", () => {
    const row = {
      id: "61000000-0000-4000-8000-000000000001",
      paymentId: "60000000-0000-4000-8000-000000000001",
      fromStatus: "pending" as const,
      toStatus: "paid" as const,
      metadata: { paymentId: "60000000-0000-4000-8000-000000000001" },
      createdAt: "2026-06-03T02:05:00.000Z",
    };

    expect(() => paymentStatusHistorySchema.parse(row)).not.toThrow();
    expect(() =>
      paymentStatusHistorySchema.parse({ ...row, secretToken: "x" }),
    ).toThrow();
  });
});

describe("createManualPaymentInputSchema", () => {
  const baseInput = {
    clientId: "10000000-0000-4000-8000-000000000001",
    amountIdr: 750000,
    paymentMethod: "cash" as const,
  };

  it("limits create status to pending or paid", () => {
    expect(createPaymentStatusSchema.parse("pending")).toBe("pending");
    expect(createPaymentStatusSchema.parse("paid")).toBe("paid");
    expect(() => createPaymentStatusSchema.parse("refunded")).toThrow();
    expect(() => createPaymentStatusSchema.parse("cancelled")).toThrow();
  });

  it("accepts a pending payment without paidAt", () => {
    expect(() =>
      createManualPaymentInputSchema.parse({ ...baseInput, status: "pending" }),
    ).not.toThrow();
  });

  it("requires paidAt when status is paid", () => {
    expect(() =>
      createManualPaymentInputSchema.parse({ ...baseInput, status: "paid" }),
    ).toThrow();
    expect(() =>
      createManualPaymentInputSchema.parse({
        ...baseInput,
        status: "paid",
        paidAt: "2026-06-03T02:00:00.000Z",
      }),
    ).not.toThrow();
  });

  it("rejects paidAt when status is pending", () => {
    expect(() =>
      createManualPaymentInputSchema.parse({
        ...baseInput,
        status: "pending",
        paidAt: "2026-06-03T02:00:00.000Z",
      }),
    ).toThrow();
  });

  it("requires a positive amountIdr and rejects sensitive notes or references", () => {
    expect(() =>
      createManualPaymentInputSchema.parse({
        ...baseInput,
        status: "pending",
        amountIdr: 0,
      }),
    ).toThrow();
    expect(() =>
      createManualPaymentInputSchema.parse({
        ...baseInput,
        status: "pending",
        notes: "card 4111 1111 1111 1111",
      }),
    ).toThrow();
    expect(() =>
      createManualPaymentInputSchema.parse({
        ...baseInput,
        status: "pending",
        referenceNumber: "sk_live_abcdef123456",
      }),
    ).toThrow();
  });

  it("rejects unknown keys", () => {
    expect(() =>
      createManualPaymentInputSchema.parse({
        ...baseInput,
        status: "pending",
        cardNumber: "4111111111111111",
      }),
    ).toThrow();
  });
});

describe("payment transition input schemas", () => {
  const paymentId = "60000000-0000-4000-8000-000000000002";

  it("requires a paymentId and paidAt to mark paid", () => {
    expect(() =>
      markPaymentPaidInputSchema.parse({
        paymentId,
        paidAt: "2026-06-03T02:00:00.000Z",
      }),
    ).not.toThrow();
    expect(() =>
      markPaymentPaidInputSchema.parse({ paymentId }),
    ).toThrow();
    expect(() =>
      markPaymentPaidInputSchema.parse({
        paymentId,
        paidAt: "2026-06-03T02:00:00.000Z",
        extra: "x",
      }),
    ).toThrow();
  });

  it("requires a safe cancellation reason within 280 characters", () => {
    expect(() =>
      cancelPaymentInputSchema.parse({
        paymentId,
        reason: "Mock cancellation reason.",
      }),
    ).not.toThrow();
    expect(() =>
      cancelPaymentInputSchema.parse({ paymentId, reason: "" }),
    ).toThrow();
    expect(() =>
      cancelPaymentInputSchema.parse({ paymentId, reason: "a".repeat(281) }),
    ).toThrow();
    expect(() =>
      cancelPaymentInputSchema.parse({
        paymentId,
        reason: "card 4111 1111 1111 1111",
      }),
    ).toThrow();
  });
});

describe("mock payment repositories", () => {
  it("exposes only list and getById", () => {
    const repository = createMockPaymentRepository();
    expect(Object.keys(repository).sort()).toEqual(["getById", "list"]);

    const historyRepository = createMockPaymentStatusHistoryRepository();
    expect(Object.keys(historyRepository).sort()).toEqual(["getById", "list"]);
  });

  it("lists and filters mock payments without secrets", async () => {
    const repository = createMockPaymentRepository();

    const all = await repository.list();
    expect(all.total).toBe(mockPayments.length);
    expect(all.items.length).toBeGreaterThan(0);

    const paid = await repository.list({ status: "paid" });
    expect(paid.items.every((payment) => payment.status === "paid")).toBe(true);

    const byClient = await repository.list({
      clientId: "10000000-0000-4000-8000-000000000001",
    });
    expect(
      byClient.items.every(
        (payment) =>
          payment.clientId === "10000000-0000-4000-8000-000000000001",
      ),
    ).toBe(true);

    const serialized = JSON.stringify(all.items).toLowerCase();
    expect(serialized).not.toContain("cvv");
    expect(serialized).not.toContain("sk_live");
    expect(serialized).not.toContain("card number");
    expect(serialized).not.toContain("@");
  });

  it("gets a mock payment and history row by id", async () => {
    const repository = createMockPaymentRepository();
    const found = await repository.getById(mockPayments[0].id);
    expect(found?.id).toBe(mockPayments[0].id);
    expect(await repository.getById("missing")).toBeNull();

    const historyRepository = createMockPaymentStatusHistoryRepository();
    const history = await historyRepository.getById(
      mockPaymentStatusHistory[0].id,
    );
    expect(history?.id).toBe(mockPaymentStatusHistory[0].id);

    const byPayment = await historyRepository.list({
      paymentId: "60000000-0000-4000-8000-000000000001",
    });
    expect(
      byPayment.items.every(
        (item) => item.paymentId === "60000000-0000-4000-8000-000000000001",
      ),
    ).toBe(true);
  });
});
