import { describe, expect, it } from "vitest";

import {
  catalogListQueryBaseSchema,
} from "../src/catalog";
import {
  clientListQuerySchema,
  clientSchema,
  clientStatusSchema,
  createClientInputSchema,
  createMockClientRepository,
  mockClients,
  updateClientInputSchema,
} from "../src/clients";
import {
  createMockPractitionerRepository,
  createPractitionerInputSchema,
  mockPractitioners,
  practitionerListQuerySchema,
  practitionerSchema,
  practitionerStatusSchema,
  updatePractitionerInputSchema,
} from "../src/practitioners";
import {
  createMockServiceRepository,
  createServiceInputSchema,
  mockServices,
  serviceListQuerySchema,
  serviceSchema,
  serviceStatusSchema,
  updateServiceInputSchema,
} from "../src/services";

const mockClientId = "10000000-0000-4000-8000-000000000001";
const mockPractitionerId = "20000000-0000-4000-8000-000000000001";
const mockServiceId = "30000000-0000-4000-8000-000000000001";

describe("catalog shared schemas", () => {
  it("applies list query defaults", () => {
    expect(catalogListQueryBaseSchema.parse({})).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
    });
  });

  it("rejects invalid list query paging", () => {
    expect(catalogListQueryBaseSchema.safeParse({ page: 0 }).success).toBe(
      false,
    );
    expect(
      catalogListQueryBaseSchema.safeParse({ pageSize: 101 }).success,
    ).toBe(false);
  });
});

describe("client catalog domain", () => {
  it("accepts only approved client statuses", () => {
    expect(clientStatusSchema.safeParse("active").success).toBe(true);
    expect(clientStatusSchema.safeParse("prospect").success).toBe(true);
    expect(clientStatusSchema.safeParse("deleted").success).toBe(false);
  });

  it("validates safe client read models", () => {
    expect(clientSchema.safeParse(mockClients[0]).success).toBe(true);
    expect(
      clientSchema.safeParse({
        ...mockClients[0],
        phone: "+62 812 0000 0000",
      }).success,
    ).toBe(false);
  });

  it("validates client mutation contracts without exposing routes", () => {
    expect(
      createClientInputSchema.safeParse({
        fullName: "Mock Client Contract",
        email: "client.contract@example.invalid",
        status: "active",
        createdByAppUserId: "00000000-0000-4000-8000-000000000001",
      }).success,
    ).toBe(true);
    expect(
      createClientInputSchema.safeParse({
        fullName: "Mock Client Contract",
        email: "not-an-email",
      }).success,
    ).toBe(false);
    expect(
      updateClientInputSchema.safeParse({
        id: mockClientId,
      }).success,
    ).toBe(false);
  });

  it("lists and gets clients from the mock repository", async () => {
    const repository = createMockClientRepository();

    await expect(repository.getById(mockClientId)).resolves.toMatchObject({
      fullName: "Mock Client Alpha",
    });
    await expect(repository.getById("99999999-0000-4000-8000-000000000999")).resolves.toBeNull();
    await expect(repository.list({ status: "prospect" })).resolves.toMatchObject({
      total: 1,
      items: [{ fullName: "Mock Client Beta" }],
    });
    await expect(repository.list({ search: "gamma" })).resolves.toMatchObject({
      total: 1,
      items: [{ fullName: "Mock Client Gamma" }],
    });
  });

  it("has only read-only client repository methods", () => {
    expect(Object.keys(createMockClientRepository()).sort()).toEqual([
      "getById",
      "list",
    ]);
  });
});

describe("practitioner catalog domain", () => {
  it("accepts only approved practitioner statuses", () => {
    expect(practitionerStatusSchema.safeParse("active").success).toBe(true);
    expect(practitionerStatusSchema.safeParse("archived").success).toBe(true);
    expect(practitionerStatusSchema.safeParse("on_leave").success).toBe(false);
  });

  it("uses appUserId when referencing app identity", () => {
    expect(practitionerSchema.safeParse(mockPractitioners[0]).success).toBe(
      true,
    );
    expect(
      practitionerSchema.safeParse({
        ...mockPractitioners[0],
        userId: "00000000-0000-4000-8000-000000000011",
      }).success,
    ).toBe(false);
  });

  it("validates practitioner list query defaults and inputs", () => {
    expect(practitionerListQuerySchema.parse({})).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
    });
    expect(
      createPractitionerInputSchema.safeParse({
        appUserId: "00000000-0000-4000-8000-000000000011",
        displayName: "Mock Practitioner Contract",
        email: "practitioner.contract@example.invalid",
      }).success,
    ).toBe(true);
    expect(
      updatePractitionerInputSchema.safeParse({
        id: mockPractitionerId,
      }).success,
    ).toBe(false);
  });

  it("lists and gets practitioners from the mock repository", async () => {
    const repository = createMockPractitionerRepository();

    await expect(repository.getById(mockPractitionerId)).resolves.toMatchObject({
      displayName: "Mock Practitioner One",
    });
    await expect(repository.list({ search: "two" })).resolves.toMatchObject({
      total: 1,
      items: [{ displayName: "Mock Practitioner Two" }],
    });
  });

  it("has only read-only practitioner repository methods", () => {
    expect(Object.keys(createMockPractitionerRepository()).sort()).toEqual([
      "getById",
      "list",
    ]);
  });
});

describe("service catalog domain", () => {
  it("accepts only approved service statuses", () => {
    expect(serviceStatusSchema.safeParse("active").success).toBe(true);
    expect(serviceStatusSchema.safeParse("inactive").success).toBe(true);
    expect(serviceStatusSchema.safeParse("draft").success).toBe(false);
  });

  it("uses defaultPriceIdr instead of cents naming", () => {
    const parsed = serviceSchema.parse(mockServices[0]);

    expect(parsed.defaultPriceIdr).toBe(450000);
    expect("defaultPriceCents" in parsed).toBe(false);
    expect(
      serviceSchema.safeParse({
        ...mockServices[0],
        defaultPriceCents: 45000000,
      }).success,
    ).toBe(false);
  });

  it("validates service list query defaults and invalid inputs", () => {
    expect(serviceListQuerySchema.parse({})).toEqual({
      search: "",
      page: 1,
      pageSize: 20,
    });
    expect(
      createServiceInputSchema.safeParse({
        name: "Mock Service Contract",
        category: "private_session",
        defaultDurationMinutes: 50,
        defaultPriceIdr: 550000,
      }).success,
    ).toBe(true);
    expect(
      createServiceInputSchema.safeParse({
        name: "Mock Service Contract",
        category: "private_session",
        defaultDurationMinutes: 0,
        defaultPriceIdr: 550000,
      }).success,
    ).toBe(false);
    expect(
      updateServiceInputSchema.safeParse({
        id: mockServiceId,
      }).success,
    ).toBe(false);
  });

  it("lists and gets services from the mock repository", async () => {
    const repository = createMockServiceRepository();

    await expect(repository.getById(mockServiceId)).resolves.toMatchObject({
      name: "Mock Intro Assessment",
      defaultPriceIdr: 450000,
    });
    await expect(repository.list({ category: "private_session" })).resolves.toMatchObject({
      total: 1,
      items: [{ name: "Mock Private Session" }],
    });
  });

  it("has only read-only service repository methods", () => {
    expect(Object.keys(createMockServiceRepository()).sort()).toEqual([
      "getById",
      "list",
    ]);
  });
});
