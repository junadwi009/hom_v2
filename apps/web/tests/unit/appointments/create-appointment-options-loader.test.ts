import {
  createMockClientRepository,
  type Client,
} from "@hom/domain/clients";
import {
  createMockPractitionerRepository,
  type Practitioner,
} from "@hom/domain/practitioners";
import {
  createMockServiceRepository,
  type Service,
} from "@hom/domain/services";
import { describe, expect, it } from "vitest";

import { loadCreateAppointmentOptions } from "../../../src/features/appointments/create-appointment-options-loader";

const timestamps = {
  createdAt: "2026-06-01T01:00:00.000Z",
  updatedAt: "2026-06-01T01:00:00.000Z",
};

const clients = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    fullName: "Mock Client Active",
    status: "active",
    primaryPractitionerId: null,
    primaryPractitionerName: null,
    maskedPhone: "***-***-0001",
    maskedEmail: "m***@example.invalid",
    createdByAppUserId: null,
    ...timestamps,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    fullName: "Mock Client Archived",
    status: "archived",
    primaryPractitionerId: null,
    primaryPractitionerName: null,
    maskedPhone: "***-***-0002",
    maskedEmail: "a***@example.invalid",
    createdByAppUserId: null,
    ...timestamps,
  },
] satisfies Client[];

const practitioners = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    appUserId: null,
    displayName: "Mock Practitioner Active",
    status: "active",
    maskedEmail: "p***@example.invalid",
    ...timestamps,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    appUserId: null,
    displayName: "Mock Practitioner Inactive",
    status: "inactive",
    maskedEmail: "i***@example.invalid",
    ...timestamps,
  },
] satisfies Practitioner[];

const services = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    name: "Mock Service Active",
    category: "mock",
    defaultDurationMinutes: 60,
    defaultPriceIdr: 450000,
    status: "active",
    ...timestamps,
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    name: "Mock Service Inactive",
    category: "mock",
    defaultDurationMinutes: 45,
    defaultPriceIdr: 350000,
    status: "inactive",
    ...timestamps,
  },
] satisfies Service[];

describe("loadCreateAppointmentOptions", () => {
  it("returns minimal safe options and excludes unavailable catalog records", async () => {
    const state = await loadCreateAppointmentOptions({
      dataMode: "mock",
      repositories: {
        clients: createMockClientRepository(clients),
        practitioners: createMockPractitionerRepository(practitioners),
        services: createMockServiceRepository(services),
      },
    });

    expect(state).toEqual({
      status: "ready",
      dataMode: "mock",
      options: {
        clients: [
          {
            id: clients[0].id,
            label: "Mock Client Active",
            status: "active",
          },
        ],
        practitioners: [
          {
            id: practitioners[0].id,
            label: "Mock Practitioner Active",
            status: "active",
          },
        ],
        services: [
          {
            id: services[0].id,
            label: "Mock Service Active",
            status: "active",
            durationMinutes: 60,
          },
        ],
      },
    });
    expect(JSON.stringify(state)).not.toContain("example.invalid");
    expect(JSON.stringify(state)).not.toContain("450000");
  });
});
