import type { Practitioner } from "@hom/domain/practitioners";
import { describe, expect, it, vi, afterEach } from "vitest";

import { CatalogRepositoryError } from "../../../src/lib/catalog/errors";
import {
  createEmptyPractitionerRepository,
  loadPractitionersCatalogPage,
} from "../../../src/features/catalog/practitioners/practitioners-page-loader";
import { toPractitionerTableRow } from "../../../src/features/catalog/practitioners/practitioners-page-state";

const mockPractitioner = {
  id: "20000000-0000-4000-8000-000000000001",
  appUserId: "00000000-0000-4000-8000-000000000011",
  displayName: "Mock Practitioner One",
  status: "active",
  maskedEmail: "practitioner.one@example.invalid",
  createdAt: "2026-05-27T01:00:00.000Z",
  updatedAt: "2026-05-27T01:00:00.000Z",
} satisfies Practitioner;

function createFailingPractitionerRepository(error: unknown) {
  return {
    async list() {
      throw error;
    },
    async getById() {
      return null;
    },
  };
}

describe("loadPractitionersCatalogPage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a ready state in mock mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "mock");

    const state = await loadPractitionersCatalogPage();

    expect(state).toMatchObject({
      status: "ready",
      source: "mock",
      total: 3,
      pageSize: 20,
    });
    expect(state.status === "ready" ? state.rows[0]?.displayName : null).toBe(
      "Mock Practitioner One",
    );
  });

  it("uses mock mode when HOM_DATA_MODE is missing", async () => {
    vi.unstubAllEnvs();

    const state = await loadPractitionersCatalogPage();

    expect(state.status).toBe("ready");
    expect(state.source).toBe("mock");
  });

  it("uses mock mode when HOM_DATA_MODE is invalid", async () => {
    vi.stubEnv("HOM_DATA_MODE", "not_a_mode");

    const state = await loadPractitionersCatalogPage();

    expect(state.status).toBe("ready");
    expect(state.source).toBe("mock");
  });

  it("returns an empty state when the repository has no practitioners", async () => {
    const state = await loadPractitionersCatalogPage({
      source: "mock",
      repositories: {
        practitioners: createEmptyPractitionerRepository(),
      },
    });

    expect(state).toEqual({
      status: "empty",
      source: "mock",
    });
  });

  it("maps permission failures to a safe Supabase permission state", async () => {
    const state = await loadPractitionersCatalogPage({
      source: "supabase",
      repositories: {
        practitioners: createFailingPractitionerRepository(
          new CatalogRepositoryError({
            operation: "practitioners.list",
            table: "practitioners",
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
    const state = await loadPractitionersCatalogPage({
      source: "supabase",
      repositories: {
        practitioners: createFailingPractitionerRepository(
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

describe("toPractitionerTableRow", () => {
  it("does not include raw or masked email or app user IDs", () => {
    const row = toPractitionerTableRow(mockPractitioner);

    expect(row).toEqual({
      id: mockPractitioner.id,
      displayName: "Mock Practitioner One",
      status: "active",
      appProfile: "Linked",
      updated: "2026-05-27",
    });
    expect("email" in row).toBe(false);
    expect("maskedEmail" in row).toBe(false);
    expect("appUserId" in row).toBe(false);
    expect(JSON.stringify(row)).not.toContain(mockPractitioner.maskedEmail);
    expect(JSON.stringify(row)).not.toContain(
      mockPractitioner.appUserId as string,
    );
  });

  it("maps a missing app user id to a not-linked label", () => {
    const row = toPractitionerTableRow({
      ...mockPractitioner,
      appUserId: null,
    });

    expect(row.appProfile).toBe("Not linked");
  });
});
