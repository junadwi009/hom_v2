import type { ServiceRepository } from "@hom/domain/services";

import { CatalogRepositoryError } from "@/lib/catalog/errors";
import {
  createCatalogRepositories,
  type CatalogRepositories,
} from "@/lib/catalog/repository-factory";
import { getDataMode } from "@/lib/env/app-mode";

import {
  toServiceTableRow,
  type CatalogDataSource,
  type ServicesPageState,
} from "./services-page-state";

type LoadServicesCatalogPageOptions = {
  repositories?: Pick<CatalogRepositories, "services">;
  source?: CatalogDataSource;
};

const DEFAULT_SERVICE_LIST_QUERY = {
  page: 1,
  pageSize: 20,
} as const;

export async function loadServicesCatalogPage(
  options: LoadServicesCatalogPageOptions = {},
): Promise<ServicesPageState> {
  const source = options.source ?? getDataMode();

  try {
    const serviceRepository =
      options.repositories?.services ??
      (await createCatalogRepositories()).services;
    const result = await serviceRepository.list(DEFAULT_SERVICE_LIST_QUERY);

    if (result.total === 0) {
      return {
        status: "empty",
        source,
      };
    }

    return {
      status: "ready",
      source,
      rows: result.items.map(toServiceTableRow),
      total: result.total,
      pageSize: result.pageSize,
    };
  } catch (error) {
    return toSafeServicesPageErrorState(error, source);
  }
}

function toSafeServicesPageErrorState(
  error: unknown,
  source: CatalogDataSource,
): ServicesPageState {
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
    error instanceof CatalogRepositoryError &&
    (error.code === "42501" || error.status === 401 || error.status === 403)
  );
}

function isSupabaseConfigurationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Supabase public environment variables are missing")
  );
}

export function createEmptyServiceRepository(): ServiceRepository {
  return {
    async list() {
      return {
        items: [],
        total: 0,
        page: DEFAULT_SERVICE_LIST_QUERY.page,
        pageSize: DEFAULT_SERVICE_LIST_QUERY.pageSize,
      };
    },
    async getById() {
      return null;
    },
  };
}
