import type { ClientRepository } from "@hom/domain/clients";

import { CatalogRepositoryError } from "@/lib/catalog/errors";
import {
  createCatalogRepositories,
  type CatalogRepositories,
} from "@/lib/catalog/repository-factory";
import { getDataMode } from "@/lib/env/app-mode";

import {
  toClientTableRow,
  type CatalogDataSource,
  type ClientsPageState,
} from "./clients-page-state";

type LoadClientsCatalogPageOptions = {
  repositories?: Pick<CatalogRepositories, "clients">;
  source?: CatalogDataSource;
};

const DEFAULT_CLIENT_LIST_QUERY = {
  page: 1,
  pageSize: 20,
} as const;

export async function loadClientsCatalogPage(
  options: LoadClientsCatalogPageOptions = {},
): Promise<ClientsPageState> {
  const source = options.source ?? getDataMode();

  try {
    const clientsRepository =
      options.repositories?.clients ?? (await createCatalogRepositories()).clients;
    const result = await clientsRepository.list(DEFAULT_CLIENT_LIST_QUERY);

    if (result.total === 0) {
      return {
        status: "empty",
        source,
      };
    }

    return {
      status: "ready",
      source,
      rows: result.items.map(toClientTableRow),
      total: result.total,
      pageSize: result.pageSize,
    };
  } catch (error) {
    return toSafeClientsPageErrorState(error, source);
  }
}

function toSafeClientsPageErrorState(
  error: unknown,
  source: CatalogDataSource,
): ClientsPageState {
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

export function createEmptyClientRepository(): ClientRepository {
  return {
    async list() {
      return {
        items: [],
        total: 0,
        page: DEFAULT_CLIENT_LIST_QUERY.page,
        pageSize: DEFAULT_CLIENT_LIST_QUERY.pageSize,
      };
    },
    async getById() {
      return null;
    },
  };
}
