import type {
  ClientPackage,
  ClientPackageListQuery,
  ClientPackageListResult,
  Package,
  PackageListQuery,
  PackageListResult,
  PackageUsageHistory,
  PackageUsageHistoryListQuery,
  PackageUsageHistoryListResult,
} from "./types";

export type PackageRepository = {
  list(query?: Partial<PackageListQuery>): Promise<PackageListResult>;
  getById(id: string): Promise<Package | null>;
};

export type ClientPackageRepository = {
  list(
    query?: Partial<ClientPackageListQuery>,
  ): Promise<ClientPackageListResult>;
  getById(id: string): Promise<ClientPackage | null>;
};

export type PackageUsageHistoryRepository = {
  list(
    query?: Partial<PackageUsageHistoryListQuery>,
  ): Promise<PackageUsageHistoryListResult>;
  getById(id: string): Promise<PackageUsageHistory | null>;
};
