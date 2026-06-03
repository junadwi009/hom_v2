import { describe, expect, it } from "vitest";

import {
  clientPackageListQuerySchema,
  clientPackageSchema,
  clientPackageStatusSchema,
  assignClientPackageInputSchema,
  createMockClientPackageRepository,
  createMockPackageRepository,
  createMockPackageUsageHistoryRepository,
  mockClientPackages,
  mockPackages,
  mockPackageUsageHistory,
  packageListQuerySchema,
  packageSchema,
  packageStatusSchema,
  packageTypeSchema,
  packageUsageChangeTypeSchema,
  packageUsageHistorySchema,
  packageUsageHistoryListQuerySchema,
} from "../src/packages";

const mockPackageId = "50000000-0000-4000-8000-000000000001";
const mockClientPackageId = "51000000-0000-4000-8000-000000000001";
const mockUsageHistoryId = "52000000-0000-4000-8000-000000000001";

describe("package domain schemas", () => {
  it("accepts only approved package statuses", () => {
    for (const status of ["active", "inactive", "archived"]) {
      expect(packageStatusSchema.safeParse(status).success).toBe(true);
    }

    expect(packageStatusSchema.safeParse("draft").success).toBe(false);
    expect(packageStatusSchema.safeParse("deleted").success).toBe(false);
  });

  it("accepts only approved package types", () => {
    for (const packageType of ["session_pack", "membership", "intro"]) {
      expect(packageTypeSchema.safeParse(packageType).success).toBe(true);
    }

    expect(packageTypeSchema.safeParse("unlimited").success).toBe(false);
    expect(packageTypeSchema.safeParse("payment_plan").success).toBe(false);
  });

  it("accepts only approved client package statuses", () => {
    for (const status of ["active", "expired", "depleted", "cancelled"]) {
      expect(clientPackageStatusSchema.safeParse(status).success).toBe(true);
    }

    expect(clientPackageStatusSchema.safeParse("paused").success).toBe(false);
    expect(clientPackageStatusSchema.safeParse("refunded").success).toBe(false);
  });

  it("accepts only approved usage change types", () => {
    for (const changeType of [
      "assigned",
      "deducted",
      "reversed",
      "adjusted",
      "cancelled",
      "expired",
    ]) {
      expect(packageUsageChangeTypeSchema.safeParse(changeType).success).toBe(
        true,
      );
    }

    expect(packageUsageChangeTypeSchema.safeParse("paid").success).toBe(false);
  });

  it("uses priceIdr and rejects cents naming", () => {
    const parsed = packageSchema.parse(mockPackages[0]);

    expect(parsed.priceIdr).toBe(750000);
    expect("priceCents" in parsed).toBe(false);
    expect(
      packageSchema.safeParse({
        ...mockPackages[0],
        priceCents: 75000000,
      }).success,
    ).toBe(false);
  });

  it("validates package session, validity, and price rules", () => {
    expect(packageSchema.safeParse(mockPackages[0]).success).toBe(true);
    expect(
      packageSchema.safeParse({
        ...mockPackages[0],
        totalSessions: 0,
      }).success,
    ).toBe(false);
    expect(
      packageSchema.safeParse({
        ...mockPackages[0],
        totalSessions: null,
      }).success,
    ).toBe(false);
    expect(
      packageSchema.safeParse({
        ...mockPackages[0],
        validityDays: 0,
      }).success,
    ).toBe(false);
    expect(
      packageSchema.safeParse({
        ...mockPackages[0],
        priceIdr: -1,
      }).success,
    ).toBe(false);
  });

  it("validates client package remaining session bounds", () => {
    expect(clientPackageSchema.safeParse(mockClientPackages[0]).success).toBe(
      true,
    );
    expect(
      clientPackageSchema.safeParse({
        ...mockClientPackages[0],
        remainingSessions: -1,
      }).success,
    ).toBe(false);
    expect(
      clientPackageSchema.safeParse({
        ...mockClientPackages[0],
        remainingSessions: mockClientPackages[0].totalSessions + 1,
      }).success,
    ).toBe(false);
  });

  it("validates usage history quantity and reason safety", () => {
    expect(
      packageUsageHistorySchema.safeParse(mockPackageUsageHistory[0]).success,
    ).toBe(true);
    expect(
      packageUsageHistorySchema.safeParse({
        ...mockPackageUsageHistory[0],
        quantity: 0,
      }).success,
    ).toBe(false);
    expect(
      packageUsageHistorySchema.safeParse({
        ...mockPackageUsageHistory[0],
        reason: "x".repeat(281),
      }).success,
    ).toBe(false);
    expect(
      packageUsageHistorySchema.safeParse({
        ...mockPackageUsageHistory[0],
        reason: "Client paid by bank transfer.",
      }).success,
    ).toBe(false);
    expect(
      packageUsageHistorySchema.safeParse({
        ...mockPackageUsageHistory[0],
        reason: "Clinical note says client needs extra care.",
      }).success,
    ).toBe(false);
    expect(
      packageUsageHistorySchema.safeParse({
        ...mockPackageUsageHistory[0],
        reason: "WhatsApp message included a phone number.",
      }).success,
    ).toBe(false);
  });

  it("rejects contact and sensitive fields from package read models", () => {
    for (const field of [
      "phone",
      "email",
      "contact",
      "paymentData",
      "paymentDetails",
      "clinicalNotes",
      "medicalHistory",
      "whatsappMessages",
      "rawContact",
    ]) {
      expect(
        packageSchema.safeParse({
          ...mockPackages[0],
          [field]: "not allowed",
        }).success,
      ).toBe(false);
      expect(
        clientPackageSchema.safeParse({
          ...mockClientPackages[0],
          [field]: "not allowed",
        }).success,
      ).toBe(false);
      expect(
        packageUsageHistorySchema.safeParse({
          ...mockPackageUsageHistory[0],
          [field]: "not allowed",
        }).success,
      ).toBe(false);
    }
  });

  it("applies package list query defaults", () => {
    expect(packageListQuerySchema.parse({})).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
    });
    expect(clientPackageListQuerySchema.parse({})).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
    });
    expect(packageUsageHistoryListQuerySchema.parse({})).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
    });
  });

  it("validates assign client package input as a strict future write contract", () => {
    expect(
      assignClientPackageInputSchema.safeParse({
        clientId: "10000000-0000-4000-8000-000000000001",
        packageId: mockPackageId,
        purchasedAt: "2026-06-03T09:00:00.000Z",
      }).success,
    ).toBe(true);

    expect(
      assignClientPackageInputSchema.safeParse({
        clientId: "10000000-0000-4000-8000-000000000001",
        packageId: mockPackageId,
        purchasedAt: "2026-06-03T09:00:00.000Z",
        paymentReference: "not allowed",
      }).success,
    ).toBe(false);
  });
});

describe("package mock repositories", () => {
  it("lists and gets safe mock packages", async () => {
    const repository = createMockPackageRepository();

    await expect(repository.getById(mockPackageId)).resolves.toMatchObject({
      name: "Mock Intro Package",
      packageType: "intro",
      totalSessions: 2,
      priceIdr: 750000,
    });
    await expect(
      repository.getById("99999999-0000-4000-8000-000000000999"),
    ).resolves.toBeNull();
    await expect(repository.list({ packageType: "session_pack" })).resolves.toMatchObject({
      total: 2,
      items: [
        { name: "Mock 4 Session Pack" },
        { name: "Mock Archived Package" },
      ],
    });
    await expect(repository.list({ search: "monthly" })).resolves.toMatchObject(
      {
        total: 1,
        items: [{ name: "Mock Monthly Membership" }],
      },
    );
  });

  it("lists and gets safe mock client packages", async () => {
    const repository = createMockClientPackageRepository();

    await expect(repository.getById(mockClientPackageId)).resolves.toMatchObject(
      {
        clientName: "Mock Client Alpha",
        packageName: "Mock Intro Package",
        remainingSessions: 2,
      },
    );
    await expect(repository.list({ clientId: mockClientPackages[0].clientId })).resolves.toMatchObject({
      total: 2,
    });
    await expect(repository.list({ status: "depleted" })).resolves.toMatchObject({
      total: 1,
      items: [{ clientName: "Mock Client Beta" }],
    });
  });

  it("lists and gets safe mock package usage history", async () => {
    const repository = createMockPackageUsageHistoryRepository();

    await expect(repository.getById(mockUsageHistoryId)).resolves.toMatchObject({
      clientPackageId: mockClientPackageId,
      changeType: "assigned",
      beforeRemaining: 0,
      afterRemaining: 2,
    });
    await expect(repository.list({ changeType: "deducted" })).resolves.toMatchObject({
      total: 1,
      items: [{ reason: "Mock local usage record." }],
    });
    await expect(
      repository.list({ clientPackageId: mockClientPackageId }),
    ).resolves.toMatchObject({
      total: 1,
    });
  });

  it("has only read-only repository methods", () => {
    for (const repository of [
      createMockPackageRepository(),
      createMockClientPackageRepository(),
      createMockPackageUsageHistoryRepository(),
    ]) {
      expect(Object.keys(repository).sort()).toEqual(["getById", "list"]);
      expect("create" in repository).toBe(false);
      expect("update" in repository).toBe(false);
      expect("delete" in repository).toBe(false);
      expect("assign" in repository).toBe(false);
      expect("deduct" in repository).toBe(false);
      expect("reverse" in repository).toBe(false);
    }
  });

  it("keeps mock rows free of contact and sensitive fields", () => {
    for (const row of [
      ...mockPackages,
      ...mockClientPackages,
      ...mockPackageUsageHistory,
    ]) {
      expect(JSON.stringify(row)).toContain("Mock");
      expect(Object.keys(row)).not.toContain("phone");
      expect(Object.keys(row)).not.toContain("email");
      expect(Object.keys(row)).not.toContain("contact");
      expect(Object.keys(row)).not.toContain("paymentData");
      expect(Object.keys(row)).not.toContain("paymentDetails");
      expect(Object.keys(row)).not.toContain("clinicalNotes");
      expect(Object.keys(row)).not.toContain("medicalHistory");
      expect(Object.keys(row)).not.toContain("whatsappMessages");
      expect(Object.keys(row)).not.toContain("productionData");
    }
  });
});
