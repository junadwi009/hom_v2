import type { z } from "zod";

import type {
  clientPackageListQuerySchema,
  clientPackageListResultSchema,
  clientPackageSchema,
  clientPackageStatusSchema,
  packageListQuerySchema,
  packageListResultSchema,
  packageSchema,
  packageStatusSchema,
  packageTypeSchema,
  packageUsageChangeTypeSchema,
  packageUsageHistoryListQuerySchema,
  packageUsageHistoryListResultSchema,
  packageUsageHistorySchema,
  assignClientPackageInputSchema,
  deductClientPackageSessionInputSchema,
} from "./schemas";

export type PackageStatus = z.infer<typeof packageStatusSchema>;
export type PackageType = z.infer<typeof packageTypeSchema>;
export type Package = z.infer<typeof packageSchema>;
export type PackageListQuery = z.infer<typeof packageListQuerySchema>;
export type PackageListResult = z.infer<typeof packageListResultSchema>;

export type ClientPackageStatus = z.infer<typeof clientPackageStatusSchema>;
export type ClientPackage = z.infer<typeof clientPackageSchema>;
export type ClientPackageListQuery = z.infer<
  typeof clientPackageListQuerySchema
>;
export type ClientPackageListResult = z.infer<
  typeof clientPackageListResultSchema
>;

export type PackageUsageChangeType = z.infer<
  typeof packageUsageChangeTypeSchema
>;
export type PackageUsageHistory = z.infer<typeof packageUsageHistorySchema>;
export type PackageUsageHistoryListQuery = z.infer<
  typeof packageUsageHistoryListQuerySchema
>;
export type PackageUsageHistoryListResult = z.infer<
  typeof packageUsageHistoryListResultSchema
>;
export type AssignClientPackageInput = z.infer<
  typeof assignClientPackageInputSchema
>;
export type DeductClientPackageSessionInput = z.infer<
  typeof deductClientPackageSessionInputSchema
>;
