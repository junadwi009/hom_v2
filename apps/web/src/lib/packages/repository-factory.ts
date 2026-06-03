import {
  createMockClientPackageRepository,
  createMockPackageRepository,
  createMockPackageUsageHistoryRepository,
  type ClientPackageRepository,
  type PackageRepository,
  type PackageUsageHistoryRepository,
} from "@hom/domain/packages";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createSupabaseClientPackageRepository } from "./supabase/client-package-repository";
import { createSupabasePackageRepository } from "./supabase/package-repository";
import { createSupabasePackageUsageHistoryRepository } from "./supabase/package-usage-history-repository";
import type { PackageSupabaseClient } from "./supabase/types";

export type PackageRepositories = {
  packages: PackageRepository;
  clientPackages: ClientPackageRepository;
  packageUsageHistory: PackageUsageHistoryRepository;
};

type CreatePackageRepositoriesOptions = {
  createSupabaseClient?: () => Promise<PackageSupabaseClient>;
};

export async function createPackageRepositories(
  options: CreatePackageRepositoriesOptions = {},
): Promise<PackageRepositories> {
  if (getDataMode() !== "supabase") {
    return createMockPackageRepositories();
  }

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createPackageSupabaseClient();

  return createSupabasePackageRepositories(supabase);
}

export function createMockPackageRepositories(): PackageRepositories {
  return {
    packages: createMockPackageRepository(),
    clientPackages: createMockClientPackageRepository(),
    packageUsageHistory: createMockPackageUsageHistoryRepository(),
  };
}

export function createSupabasePackageRepositories(
  supabase: PackageSupabaseClient,
): PackageRepositories {
  return {
    packages: createSupabasePackageRepository(supabase),
    clientPackages: createSupabaseClientPackageRepository(supabase),
    packageUsageHistory: createSupabasePackageUsageHistoryRepository(supabase),
  };
}

async function createPackageSupabaseClient(): Promise<PackageSupabaseClient> {
  return (await createSupabaseServerClient()) as unknown as PackageSupabaseClient;
}
