import type { ClientRepository } from "@hom/domain/clients";
import type { PackageRepository } from "@hom/domain/packages";

import { CatalogRepositoryError } from "@/lib/catalog/errors";
import { createCatalogRepositories } from "@/lib/catalog/repository-factory";
import { getDataMode } from "@/lib/env/app-mode";
import { PackageRepositoryError } from "@/lib/packages/errors";
import {
  createPackageRepositories,
  type PackageRepositories,
} from "@/lib/packages/repository-factory";

import type {
  AssignClientPackageClientOption,
  AssignClientPackageOptionsState,
  AssignClientPackagePackageOption,
} from "./assign-client-package-types";

type LoadAssignClientPackageOptionsOptions = {
  repositories?: {
    clients: ClientRepository;
    packages: PackageRepository;
  };
  dataMode?: "mock" | "supabase";
};

export async function loadAssignClientPackageOptions(
  loaderOptions: LoadAssignClientPackageOptionsOptions = {},
): Promise<AssignClientPackageOptionsState> {
  const dataMode = loaderOptions.dataMode ?? getDataMode();

  try {
    const repositories =
      loaderOptions.repositories ?? (await createDefaultRepositories());
    const [clients, packages] = await Promise.all([
      repositories.clients.list({ page: 1, pageSize: 100 }),
      repositories.packages.list({ status: "active", page: 1, pageSize: 100 }),
    ]);

    return {
      status: "ready",
      dataMode,
      options: {
        clients: clients.items
          .filter((client) => client.status !== "archived")
          .map(toClientOption),
        packages: packages.items
          .filter((packageItem) => packageItem.status === "active")
          .map(toPackageOption),
      },
    };
  } catch (error) {
    return toSafeOptionsErrorState(error, dataMode);
  }
}

async function createDefaultRepositories(): Promise<{
  clients: ClientRepository;
  packages: PackageRepositories["packages"];
}> {
  const [catalogRepositories, packageRepositories] = await Promise.all([
    createCatalogRepositories(),
    createPackageRepositories(),
  ]);

  return {
    clients: catalogRepositories.clients,
    packages: packageRepositories.packages,
  };
}

function toClientOption(client: {
  id: string;
  fullName: string;
  status: "active" | "inactive" | "prospect" | "archived";
}): AssignClientPackageClientOption {
  if (client.status === "archived") {
    throw new Error("Archived clients cannot become package assignment options.");
  }

  return {
    id: client.id,
    label: client.fullName,
    status: client.status,
  };
}

function toPackageOption(packageItem: {
  id: string;
  name: string;
  packageType: "session_pack" | "membership" | "intro";
  totalSessions: number;
  validityDays: number;
  priceIdr: number;
  status: "active" | "inactive" | "archived";
}): AssignClientPackagePackageOption {
  if (packageItem.status !== "active") {
    throw new Error("Inactive packages cannot become package assignment options.");
  }

  return {
    id: packageItem.id,
    label: packageItem.name,
    packageType: packageItem.packageType,
    totalSessions: packageItem.totalSessions,
    validityDays: packageItem.validityDays,
    priceIdr: packageItem.priceIdr,
    status: packageItem.status,
  };
}

function toSafeOptionsErrorState(
  error: unknown,
  dataMode: "mock" | "supabase",
): AssignClientPackageOptionsState {
  if (dataMode === "supabase" && isSupabaseConfigurationError(error)) {
    return {
      status: "configuration_error",
      dataMode,
    };
  }

  if (dataMode === "supabase" && isPermissionError(error)) {
    return {
      status: "permission_denied",
      dataMode,
    };
  }

  return {
    status: "error",
    dataMode,
  };
}

function isPermissionError(error: unknown) {
  return (
    (error instanceof CatalogRepositoryError ||
      error instanceof PackageRepositoryError) &&
    (error.code === "42501" || error.status === 401 || error.status === 403)
  );
}

function isSupabaseConfigurationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Supabase public environment variables are missing")
  );
}
