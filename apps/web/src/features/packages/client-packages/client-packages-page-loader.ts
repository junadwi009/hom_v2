import type { ClientPackageRepository } from "@hom/domain/packages";

import { getDataMode } from "@/lib/env/app-mode";
import { PackageRepositoryError } from "@/lib/packages/errors";
import {
  createPackageRepositories,
  type PackageRepositories,
} from "@/lib/packages/repository-factory";

import {
  toClientPackageTableRow,
  type ClientPackageDataSource,
  type ClientPackagesPageState,
} from "./client-packages-page-state";

type LoadClientPackagesPageOptions = {
  repositories?: Pick<PackageRepositories, "clientPackages">;
  source?: ClientPackageDataSource;
};

const DEFAULT_CLIENT_PACKAGE_LIST_QUERY = {
  page: 1,
  pageSize: 20,
} as const;

export async function loadClientPackagesPage(
  options: LoadClientPackagesPageOptions = {},
): Promise<ClientPackagesPageState> {
  const source = options.source ?? getDataMode();

  try {
    const clientPackageRepository =
      options.repositories?.clientPackages ??
      (await createPackageRepositories()).clientPackages;
    const result = await clientPackageRepository.list(
      DEFAULT_CLIENT_PACKAGE_LIST_QUERY,
    );

    if (result.total === 0) {
      return {
        status: "empty",
        source,
      };
    }

    return {
      status: "ready",
      source,
      rows: result.items.map(toClientPackageTableRow),
      total: result.total,
      pageSize: result.pageSize,
    };
  } catch (error) {
    return toSafeClientPackagesPageErrorState(error, source);
  }
}

function toSafeClientPackagesPageErrorState(
  error: unknown,
  source: ClientPackageDataSource,
): ClientPackagesPageState {
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

export function createEmptyClientPackageRepository(): ClientPackageRepository {
  return {
    async list() {
      return {
        items: [],
        total: 0,
        page: DEFAULT_CLIENT_PACKAGE_LIST_QUERY.page,
        pageSize: DEFAULT_CLIENT_PACKAGE_LIST_QUERY.pageSize,
      };
    },
    async getById() {
      return null;
    },
  };
}
