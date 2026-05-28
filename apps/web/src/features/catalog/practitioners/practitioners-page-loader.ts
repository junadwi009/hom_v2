import type { PractitionerRepository } from "@hom/domain/practitioners";

import { CatalogRepositoryError } from "@/lib/catalog/errors";
import {
  createCatalogRepositories,
  type CatalogRepositories,
} from "@/lib/catalog/repository-factory";
import { getDataMode } from "@/lib/env/app-mode";

import {
  toPractitionerTableRow,
  type CatalogDataSource,
  type PractitionersPageState,
} from "./practitioners-page-state";

type LoadPractitionersCatalogPageOptions = {
  repositories?: Pick<CatalogRepositories, "practitioners">;
  source?: CatalogDataSource;
};

const DEFAULT_PRACTITIONER_LIST_QUERY = {
  page: 1,
  pageSize: 20,
} as const;

export async function loadPractitionersCatalogPage(
  options: LoadPractitionersCatalogPageOptions = {},
): Promise<PractitionersPageState> {
  const source = options.source ?? getDataMode();

  try {
    const practitionerRepository =
      options.repositories?.practitioners ??
      (await createCatalogRepositories()).practitioners;
    const result = await practitionerRepository.list(
      DEFAULT_PRACTITIONER_LIST_QUERY,
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
      rows: result.items.map(toPractitionerTableRow),
      total: result.total,
      pageSize: result.pageSize,
    };
  } catch (error) {
    return toSafePractitionersPageErrorState(error, source);
  }
}

function toSafePractitionersPageErrorState(
  error: unknown,
  source: CatalogDataSource,
): PractitionersPageState {
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

export function createEmptyPractitionerRepository(): PractitionerRepository {
  return {
    async list() {
      return {
        items: [],
        total: 0,
        page: DEFAULT_PRACTITIONER_LIST_QUERY.page,
        pageSize: DEFAULT_PRACTITIONER_LIST_QUERY.pageSize,
      };
    },
    async getById() {
      return null;
    },
  };
}
