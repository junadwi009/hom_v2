import type { PackageRepository } from "@hom/domain/packages";

import { getDataMode } from "@/lib/env/app-mode";
import { PackageRepositoryError } from "@/lib/packages/errors";
import {
  createPackageRepositories,
  type PackageRepositories,
} from "@/lib/packages/repository-factory";

import {
  toPackageTableRow,
  type PackageDataSource,
  type PackagesPageState,
} from "./packages-page-state";

type LoadPackagesPageOptions = {
  repositories?: Pick<PackageRepositories, "packages">;
  source?: PackageDataSource;
};

const DEFAULT_PACKAGE_LIST_QUERY = {
  page: 1,
  pageSize: 20,
} as const;

export async function loadPackagesPage(
  options: LoadPackagesPageOptions = {},
): Promise<PackagesPageState> {
  const source = options.source ?? getDataMode();

  try {
    const packageRepository =
      options.repositories?.packages ?? (await createPackageRepositories()).packages;
    const result = await packageRepository.list(DEFAULT_PACKAGE_LIST_QUERY);

    if (result.total === 0) {
      return {
        status: "empty",
        source,
      };
    }

    return {
      status: "ready",
      source,
      rows: result.items.map(toPackageTableRow),
      total: result.total,
      pageSize: result.pageSize,
    };
  } catch (error) {
    return toSafePackagesPageErrorState(error, source);
  }
}

function toSafePackagesPageErrorState(
  error: unknown,
  source: PackageDataSource,
): PackagesPageState {
  if (source === "supabase" && isSupabaseConfigurationError(error)) {
    return {
      status: "configuration_error",
      source,
    };
  }

  if (source === "supabase" && isPermissionError(error)) {
    return {
      status: "permission_denied",
      source,
    };
  }

  return {
    status: "error",
    source,
  };
}

function isPermissionError(error: unknown) {
  return (
    error instanceof PackageRepositoryError &&
    (error.code === "42501" || error.status === 401 || error.status === 403)
  );
}

function isSupabaseConfigurationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Supabase public environment variables are missing")
  );
}

export function createEmptyPackageRepository(): PackageRepository {
  return {
    async list() {
      return {
        items: [],
        total: 0,
        page: DEFAULT_PACKAGE_LIST_QUERY.page,
        pageSize: DEFAULT_PACKAGE_LIST_QUERY.pageSize,
      };
    },
    async getById() {
      return null;
    },
  };
}
