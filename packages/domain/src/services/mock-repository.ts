import {
  applyCatalogPagination,
  includesCatalogSearch,
} from "../catalog/mock-utils";
import {
  serviceListQuerySchema,
  serviceListResultSchema,
  serviceSchema,
} from "./schemas";
import type { ServiceRepository } from "./repository";
import type { Service } from "./types";

export const mockServices = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    name: "Mock Intro Assessment",
    category: "assessment",
    defaultDurationMinutes: 60,
    defaultPriceIdr: 450000,
    status: "active",
    createdAt: "2026-05-27T01:00:00.000Z",
    updatedAt: "2026-05-27T01:00:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    name: "Mock Private Session",
    category: "private_session",
    defaultDurationMinutes: 50,
    defaultPriceIdr: 550000,
    status: "active",
    createdAt: "2026-05-27T01:05:00.000Z",
    updatedAt: "2026-05-27T01:05:00.000Z",
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    name: "Mock Archived Service",
    category: "archive_only",
    defaultDurationMinutes: 45,
    defaultPriceIdr: null,
    status: "archived",
    createdAt: "2026-05-27T01:10:00.000Z",
    updatedAt: "2026-05-27T01:10:00.000Z",
  },
] as const satisfies readonly Service[];

export function createMockServiceRepository(
  seed: readonly Service[] = mockServices,
): ServiceRepository {
  const services = seed.map((service) => serviceSchema.parse(service));

  return {
    async list(query = {}) {
      const parsedQuery = serviceListQuerySchema.parse(query);
      const filtered = services.filter(
        (service) =>
          (!parsedQuery.status || service.status === parsedQuery.status) &&
          (!parsedQuery.category ||
            service.category === parsedQuery.category) &&
          includesCatalogSearch(
            [service.name, service.category],
            parsedQuery.search,
          ),
      );

      return serviceListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return services.find((service) => service.id === id) ?? null;
    },
  };
}
