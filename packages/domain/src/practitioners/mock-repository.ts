import {
  applyCatalogPagination,
  includesCatalogSearch,
} from "../catalog/mock-utils";
import {
  practitionerListQuerySchema,
  practitionerListResultSchema,
  practitionerSchema,
} from "./schemas";
import type { PractitionerRepository } from "./repository";
import type { Practitioner } from "./types";

export const mockPractitioners = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    appUserId: "00000000-0000-4000-8000-000000000011",
    displayName: "Mock Practitioner One",
    status: "active",
    maskedEmail: "practitioner.one@example.invalid",
    createdAt: "2026-05-27T01:00:00.000Z",
    updatedAt: "2026-05-27T01:00:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    appUserId: null,
    displayName: "Mock Practitioner Two",
    status: "active",
    maskedEmail: null,
    createdAt: "2026-05-27T01:05:00.000Z",
    updatedAt: "2026-05-27T01:05:00.000Z",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    appUserId: null,
    displayName: "Mock Practitioner Archived",
    status: "archived",
    maskedEmail: "practitioner.archived@example.invalid",
    createdAt: "2026-05-27T01:10:00.000Z",
    updatedAt: "2026-05-27T01:10:00.000Z",
  },
] as const satisfies readonly Practitioner[];

export function createMockPractitionerRepository(
  seed: readonly Practitioner[] = mockPractitioners,
): PractitionerRepository {
  const practitioners = seed.map((practitioner) =>
    practitionerSchema.parse(practitioner),
  );

  return {
    async list(query = {}) {
      const parsedQuery = practitionerListQuerySchema.parse(query);
      const filtered = practitioners.filter(
        (practitioner) =>
          (!parsedQuery.status ||
            practitioner.status === parsedQuery.status) &&
          includesCatalogSearch(
            [practitioner.displayName, practitioner.maskedEmail],
            parsedQuery.search,
          ),
      );

      return practitionerListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return (
        practitioners.find((practitioner) => practitioner.id === id) ?? null
      );
    },
  };
}
