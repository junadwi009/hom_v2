import {
  applyCatalogPagination,
  includesCatalogSearch,
} from "../catalog/mock-utils";
import {
  clientPackageListQuerySchema,
  clientPackageListResultSchema,
  clientPackageSchema,
  packageListQuerySchema,
  packageListResultSchema,
  packageSchema,
  packageUsageHistoryListQuerySchema,
  packageUsageHistoryListResultSchema,
  packageUsageHistorySchema,
} from "./schemas";
import type {
  ClientPackageRepository,
  PackageRepository,
  PackageUsageHistoryRepository,
} from "./repository";
import type { ClientPackage, Package, PackageUsageHistory } from "./types";

export const mockPackages = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    name: "Mock Intro Package",
    packageType: "intro",
    totalSessions: 2,
    validityDays: 14,
    priceIdr: 750000,
    status: "active",
    createdAt: "2026-06-03T01:00:00.000Z",
    updatedAt: "2026-06-03T01:00:00.000Z",
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    name: "Mock 4 Session Pack",
    packageType: "session_pack",
    totalSessions: 4,
    validityDays: 45,
    priceIdr: 1800000,
    status: "active",
    createdAt: "2026-06-03T01:05:00.000Z",
    updatedAt: "2026-06-03T01:05:00.000Z",
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    name: "Mock Monthly Membership",
    packageType: "membership",
    totalSessions: 8,
    validityDays: 30,
    priceIdr: 3200000,
    status: "inactive",
    createdAt: "2026-06-03T01:10:00.000Z",
    updatedAt: "2026-06-03T01:10:00.000Z",
  },
  {
    id: "50000000-0000-4000-8000-000000000004",
    name: "Mock Archived Package",
    packageType: "session_pack",
    totalSessions: 6,
    validityDays: 60,
    priceIdr: 2400000,
    status: "archived",
    createdAt: "2026-06-03T01:15:00.000Z",
    updatedAt: "2026-06-03T01:15:00.000Z",
  },
] as const satisfies readonly Package[];

export const mockClientPackages = [
  {
    id: "51000000-0000-4000-8000-000000000001",
    clientId: "10000000-0000-4000-8000-000000000001",
    clientName: "Mock Client Alpha",
    packageId: "50000000-0000-4000-8000-000000000001",
    packageName: "Mock Intro Package",
    purchasedAt: "2026-06-03T02:00:00.000Z",
    expiresAt: "2026-06-17T02:00:00.000Z",
    totalSessions: 2,
    remainingSessions: 2,
    status: "active",
    createdAt: "2026-06-03T02:00:00.000Z",
    updatedAt: "2026-06-03T02:00:00.000Z",
  },
  {
    id: "51000000-0000-4000-8000-000000000002",
    clientId: "10000000-0000-4000-8000-000000000001",
    clientName: "Mock Client Alpha",
    packageId: "50000000-0000-4000-8000-000000000002",
    packageName: "Mock 4 Session Pack",
    purchasedAt: "2026-06-04T02:00:00.000Z",
    expiresAt: "2026-07-19T02:00:00.000Z",
    totalSessions: 4,
    remainingSessions: 3,
    status: "active",
    createdAt: "2026-06-04T02:00:00.000Z",
    updatedAt: "2026-06-04T03:00:00.000Z",
  },
  {
    id: "51000000-0000-4000-8000-000000000003",
    clientId: "10000000-0000-4000-8000-000000000002",
    clientName: "Mock Client Beta",
    packageId: "50000000-0000-4000-8000-000000000002",
    packageName: "Mock 4 Session Pack",
    purchasedAt: "2026-05-01T02:00:00.000Z",
    expiresAt: "2026-06-15T02:00:00.000Z",
    totalSessions: 4,
    remainingSessions: 0,
    status: "depleted",
    createdAt: "2026-05-01T02:00:00.000Z",
    updatedAt: "2026-06-01T03:00:00.000Z",
  },
  {
    id: "51000000-0000-4000-8000-000000000004",
    clientId: "10000000-0000-4000-8000-000000000003",
    clientName: "Mock Client Gamma",
    packageId: "50000000-0000-4000-8000-000000000003",
    packageName: "Mock Monthly Membership",
    purchasedAt: "2026-04-01T02:00:00.000Z",
    expiresAt: "2026-05-01T02:00:00.000Z",
    totalSessions: 8,
    remainingSessions: 5,
    status: "expired",
    createdAt: "2026-04-01T02:00:00.000Z",
    updatedAt: "2026-05-01T02:00:00.000Z",
  },
  {
    id: "51000000-0000-4000-8000-000000000005",
    clientId: "10000000-0000-4000-8000-000000000004",
    clientName: "Mock Client Delta",
    packageId: "50000000-0000-4000-8000-000000000001",
    packageName: "Mock Intro Package",
    purchasedAt: "2026-05-15T02:00:00.000Z",
    expiresAt: "2026-05-29T02:00:00.000Z",
    totalSessions: 2,
    remainingSessions: 1,
    status: "cancelled",
    createdAt: "2026-05-15T02:00:00.000Z",
    updatedAt: "2026-05-18T02:00:00.000Z",
  },
] as const satisfies readonly ClientPackage[];

export const mockPackageUsageHistory = [
  {
    id: "52000000-0000-4000-8000-000000000001",
    clientPackageId: "51000000-0000-4000-8000-000000000001",
    changeType: "assigned",
    quantity: 2,
    beforeRemaining: 0,
    afterRemaining: 2,
    reason: "Mock package assigned locally.",
    actorAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-06-03T02:00:00.000Z",
  },
  {
    id: "52000000-0000-4000-8000-000000000002",
    clientPackageId: "51000000-0000-4000-8000-000000000002",
    appointmentId: "40000000-0000-4000-8000-000000000001",
    changeType: "deducted",
    quantity: 1,
    beforeRemaining: 4,
    afterRemaining: 3,
    reason: "Mock local usage record.",
    actorAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-06-04T03:00:00.000Z",
  },
  {
    id: "52000000-0000-4000-8000-000000000003",
    clientPackageId: "51000000-0000-4000-8000-000000000003",
    appointmentId: "40000000-0000-4000-8000-000000000002",
    changeType: "reversed",
    quantity: 1,
    beforeRemaining: 0,
    afterRemaining: 1,
    reason: "Mock local correction.",
    actorAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-06-04T04:00:00.000Z",
  },
  {
    id: "52000000-0000-4000-8000-000000000004",
    clientPackageId: "51000000-0000-4000-8000-000000000004",
    changeType: "expired",
    quantity: 1,
    beforeRemaining: 5,
    afterRemaining: 5,
    reason: "Mock package reached expiry date.",
    actorAppUserId: "94000000-0000-4000-8000-000000000001",
    createdAt: "2026-05-01T02:00:00.000Z",
  },
] as const satisfies readonly PackageUsageHistory[];

export function createMockPackageRepository(
  seed: readonly Package[] = mockPackages,
): PackageRepository {
  const packageItems = seed.map((packageItem) =>
    packageSchema.parse(packageItem),
  );

  return {
    async list(query = {}) {
      const parsedQuery = packageListQuerySchema.parse(query);
      const filtered = packageItems.filter(
        (packageItem) =>
          (!parsedQuery.status || packageItem.status === parsedQuery.status) &&
          (!parsedQuery.packageType ||
            packageItem.packageType === parsedQuery.packageType) &&
          includesCatalogSearch(
            [packageItem.name, packageItem.packageType],
            parsedQuery.search,
          ),
      );

      return packageListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return packageItems.find((packageItem) => packageItem.id === id) ?? null;
    },
  };
}

export function createMockClientPackageRepository(
  seed: readonly ClientPackage[] = mockClientPackages,
): ClientPackageRepository {
  const clientPackages = seed.map((clientPackage) =>
    clientPackageSchema.parse(clientPackage),
  );

  return {
    async list(query = {}) {
      const parsedQuery = clientPackageListQuerySchema.parse(query);
      const filtered = clientPackages.filter(
        (clientPackage) =>
          (!parsedQuery.status ||
            clientPackage.status === parsedQuery.status) &&
          (!parsedQuery.clientId ||
            clientPackage.clientId === parsedQuery.clientId) &&
          (!parsedQuery.packageId ||
            clientPackage.packageId === parsedQuery.packageId) &&
          includesCatalogSearch(
            [clientPackage.clientName, clientPackage.packageName],
            parsedQuery.search,
          ),
      );

      return clientPackageListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return (
        clientPackages.find((clientPackage) => clientPackage.id === id) ?? null
      );
    },
  };
}

export function createMockPackageUsageHistoryRepository(
  seed: readonly PackageUsageHistory[] = mockPackageUsageHistory,
): PackageUsageHistoryRepository {
  const usageHistory = seed.map((historyItem) =>
    packageUsageHistorySchema.parse(historyItem),
  );

  return {
    async list(query = {}) {
      const parsedQuery = packageUsageHistoryListQuerySchema.parse(query);
      const filtered = usageHistory.filter(
        (historyItem) =>
          (!parsedQuery.clientPackageId ||
            historyItem.clientPackageId === parsedQuery.clientPackageId) &&
          (!parsedQuery.appointmentId ||
            historyItem.appointmentId === parsedQuery.appointmentId) &&
          (!parsedQuery.changeType ||
            historyItem.changeType === parsedQuery.changeType) &&
          includesCatalogSearch(
            [historyItem.reason, historyItem.changeType],
            parsedQuery.search,
          ),
      );

      return packageUsageHistoryListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return usageHistory.find((historyItem) => historyItem.id === id) ?? null;
    },
  };
}
