import type { Service } from "@hom/domain/services";
import { describe, expect, it, vi, afterEach } from "vitest";

import { CatalogRepositoryError } from "../../../src/lib/catalog/errors";
import {
  createEmptyServiceRepository,
  loadServicesCatalogPage,
} from "../../../src/features/catalog/services/services-page-loader";
import {
  formatDefaultPriceIdr,
  toServiceTableRow,
} from "../../../src/features/catalog/services/services-page-state";

const mockService = {
  id: "30000000-0000-4000-8000-000000000001",
  name: "Mock Intro Assessment",
  category: "assessment",
  defaultDurationMinutes: 60,
  defaultPriceIdr: 450000,
  status: "active",
  createdAt: "2026-05-27T01:00:00.000Z",
  updatedAt: "2026-05-27T01:00:00.000Z",
} satisfies Service;

function createFailingServiceRepository(error: unknown) {
  return {
    async list() {
      throw error;
    },
    async getById() {
      return null;
    },
  };
}

describe("loadServicesCatalogPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a ready state in mock mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "mock");

    const state = await loadServicesCatalogPage();

    expect(state).toMatchObject({
      status: "ready",
      source: "mock",
      total: 3,
      pageSize: 20,
    });
    expect(state.status === "ready" ? state.rows[0]?.name : null).toBe(
      "Mock Intro Assessment",
    );
  });

  it("uses mock mode when HOM_DATA_MODE is missing", async () => {
    vi.unstubAllEnvs();

    const state = await loadServicesCatalogPage();

    expect(state.status).toBe("ready");
    expect(state.source).toBe("mock");
  });

  it("uses mock mode when HOM_DATA_MODE is invalid", async () => {
    vi.stubEnv("HOM_DATA_MODE", "not_a_mode");

    const state = await loadServicesCatalogPage();

    expect(state.status).toBe("ready");
    expect(state.source).toBe("mock");
  });

  it("returns an empty state when the repository has no services", async () => {
    const state = await loadServicesCatalogPage({
      source: "mock",
      repositories: {
        services: createEmptyServiceRepository(),
      },
    });

    expect(state).toEqual({
      status: "empty",
      source: "mock",
    });
  });

  it("maps permission failures to a safe Supabase permission state", async () => {
    const state = await loadServicesCatalogPage({
      source: "supabase",
      repositories: {
        services: createFailingServiceRepository(
          new CatalogRepositoryError({
            operation: "services.list",
            table: "services",
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
    const state = await loadServicesCatalogPage({
      source: "supabase",
      repositories: {
        services: createFailingServiceRepository(
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

describe("toServiceTableRow", () => {
  it("uses defaultPriceIdr and does not include cents-based naming", () => {
    const row = toServiceTableRow(mockService);

    expect(row).toEqual({
      id: mockService.id,
      name: "Mock Intro Assessment",
      category: "assessment",
      duration: "60 min",
      defaultPriceIdr: "Rp 450.000",
      status: "active",
      updated: "2026-05-27",
    });
    expect("defaultPriceCents" in row).toBe(false);
  });

  it("renders null defaultPriceIdr as Not set, not Rp 0", () => {
    const row = toServiceTableRow({
      ...mockService,
      defaultPriceIdr: null,
    });

    expect(row.defaultPriceIdr).toBe("Not set");
    expect(row.defaultPriceIdr).not.toBe("Rp 0");
    expect(formatDefaultPriceIdr(null)).toBe("Not set");
  });
});
