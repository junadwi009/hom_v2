import type { Client } from "@hom/domain/clients";
import { describe, expect, it, vi, afterEach } from "vitest";

import { CatalogRepositoryError } from "../../../src/lib/catalog/errors";
import {
  createEmptyClientRepository,
  loadClientsCatalogPage,
} from "../../../src/features/catalog/clients/clients-page-loader";
import { toClientTableRow } from "../../../src/features/catalog/clients/clients-page-state";

const mockClient = {
  id: "10000000-0000-4000-8000-000000000001",
  fullName: "Mock Client Alpha",
  status: "active",
  primaryPractitionerId: "20000000-0000-4000-8000-000000000001",
  primaryPractitionerName: "Mock Practitioner One",
  maskedPhone: "+62 ***-***-0001",
  maskedEmail: "client.alpha@example.invalid",
  createdByAppUserId: "00000000-0000-4000-8000-000000000001",
  createdAt: "2026-05-27T01:00:00.000Z",
  updatedAt: "2026-05-27T01:00:00.000Z",
} satisfies Client;

function createFailingClientRepository(error: unknown) {
  return {
    async list() {
      throw error;
    },
    async getById() {
      return null;
    },
  };
}

describe("loadClientsCatalogPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a ready state in mock mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "mock");

    const state = await loadClientsCatalogPage();

    expect(state).toMatchObject({
      status: "ready",
      source: "mock",
      total: 3,
      pageSize: 20,
    });
    expect(state.status === "ready" ? state.rows[0]?.name : null).toBe(
      "Mock Client Alpha",
    );
  });

  it("uses mock mode when HOM_DATA_MODE is missing or invalid", async () => {
    vi.stubEnv("HOM_DATA_MODE", "not_a_mode");

    const state = await loadClientsCatalogPage();

    expect(state.status).toBe("ready");
    expect(state.source).toBe("mock");
  });

  it("returns an empty state when the repository has no clients", async () => {
    const state = await loadClientsCatalogPage({
      source: "mock",
      repositories: {
        clients: createEmptyClientRepository(),
      },
    });

    expect(state).toEqual({
      status: "empty",
      source: "mock",
    });
  });

  it("maps permission failures to a safe Supabase permission state", async () => {
    const state = await loadClientsCatalogPage({
      source: "supabase",
      repositories: {
        clients: createFailingClientRepository(
          new CatalogRepositoryError({
            operation: "clients.list",
            table: "clients",
            code: "42501",
          }),
        ),
      },
    });

    expect(state).toEqual({
      status: "permission_denied",
      source: "supabase",
    });
    expect(JSON.stringify(state)).not.toContain("42501");
    expect(JSON.stringify(state)).not.toContain("permission denied");
  });

  it("maps missing local Supabase configuration to a safe state", async () => {
    const state = await loadClientsCatalogPage({
      source: "supabase",
      repositories: {
        clients: createFailingClientRepository(
          new Error("Supabase public environment variables are missing."),
        ),
      },
    });

    expect(state).toEqual({
      status: "configuration_error",
      source: "supabase",
    });
    expect(JSON.stringify(state)).not.toContain("environment variables");
  });
});

describe("toClientTableRow", () => {
  it("does not include raw or masked phone and email contact fields", () => {
    const row = toClientTableRow(mockClient);

    expect(row).toEqual({
      id: mockClient.id,
      name: "Mock Client Alpha",
      status: "active",
      primaryPractitioner: "Mock Practitioner One",
      updated: "2026-05-27",
    });
    expect("phone" in row).toBe(false);
    expect("email" in row).toBe(false);
    expect("maskedPhone" in row).toBe(false);
    expect("maskedEmail" in row).toBe(false);
    expect(JSON.stringify(row)).not.toContain(mockClient.maskedPhone);
    expect(JSON.stringify(row)).not.toContain(mockClient.maskedEmail);
  });
});
