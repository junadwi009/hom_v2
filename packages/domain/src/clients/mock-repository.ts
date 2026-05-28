import {
  applyCatalogPagination,
  includesCatalogSearch,
} from "../catalog/mock-utils";
import {
  clientListQuerySchema,
  clientListResultSchema,
  clientSchema,
} from "./schemas";
import type { ClientRepository } from "./repository";
import type { Client } from "./types";

export const mockClients = [
  {
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
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    fullName: "Mock Client Beta",
    status: "prospect",
    primaryPractitionerId: null,
    primaryPractitionerName: null,
    maskedPhone: null,
    maskedEmail: null,
    createdByAppUserId: "00000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-27T01:05:00.000Z",
    updatedAt: "2026-05-27T01:05:00.000Z",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    fullName: "Mock Client Gamma",
    status: "inactive",
    primaryPractitionerId: "20000000-0000-4000-8000-000000000002",
    primaryPractitionerName: "Mock Practitioner Two",
    maskedPhone: "+62 ***-***-0003",
    maskedEmail: "client.gamma@example.invalid",
    createdByAppUserId: null,
    createdAt: "2026-05-27T01:10:00.000Z",
    updatedAt: "2026-05-27T01:10:00.000Z",
  },
] as const satisfies readonly Client[];

export function createMockClientRepository(
  seed: readonly Client[] = mockClients,
): ClientRepository {
  const clients = seed.map((client) => clientSchema.parse(client));

  return {
    async list(query = {}) {
      const parsedQuery = clientListQuerySchema.parse(query);
      const filtered = clients.filter(
        (client) =>
          (!parsedQuery.status || client.status === parsedQuery.status) &&
          includesCatalogSearch(
            [
              client.fullName,
              client.primaryPractitionerName,
              client.maskedEmail,
            ],
            parsedQuery.search,
          ),
      );

      return clientListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return clients.find((client) => client.id === id) ?? null;
    },
  };
}
