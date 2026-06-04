import type { ClientRepository } from "@hom/domain/clients";
import type { ClientPackageRepository } from "@hom/domain/packages";

import { CatalogRepositoryError } from "@/lib/catalog/errors";
import { createCatalogRepositories } from "@/lib/catalog/repository-factory";
import { getDataMode } from "@/lib/env/app-mode";
import { PackageRepositoryError } from "@/lib/packages/errors";
import { createPackageRepositories } from "@/lib/packages/repository-factory";

import type {
  CreatePaymentClientOption,
  CreatePaymentClientPackageOption,
  CreatePaymentOptionsState,
} from "./create-payment-types";

type LoadCreatePaymentOptionsOptions = {
  repositories?: {
    clients: ClientRepository;
    clientPackages: ClientPackageRepository;
  };
  dataMode?: "mock" | "supabase";
};

const OPTION_LIST_QUERY = { page: 1, pageSize: 100 } as const;

export async function loadCreatePaymentOptions(
  loaderOptions: LoadCreatePaymentOptionsOptions = {},
): Promise<CreatePaymentOptionsState> {
  const dataMode = loaderOptions.dataMode ?? getDataMode();

  try {
    const repositories =
      loaderOptions.repositories ?? (await createDefaultRepositories());
    const [clients, clientPackages] = await Promise.all([
      repositories.clients.list(OPTION_LIST_QUERY),
      repositories.clientPackages.list(OPTION_LIST_QUERY),
    ]);

    return {
      status: "ready",
      dataMode,
      options: {
        clients: clients.items
          .filter((client) => client.status !== "archived")
          .map(toClientOption),
        clientPackages: clientPackages.items.map(toClientPackageOption),
      },
    };
  } catch (error) {
    return toSafeOptionsErrorState(error, dataMode);
  }
}

async function createDefaultRepositories(): Promise<{
  clients: ClientRepository;
  clientPackages: ClientPackageRepository;
}> {
  const [catalogRepositories, packageRepositories] = await Promise.all([
    createCatalogRepositories(),
    createPackageRepositories(),
  ]);

  return {
    clients: catalogRepositories.clients,
    clientPackages: packageRepositories.clientPackages,
  };
}

function toClientOption(client: {
  id: string;
  fullName: string;
  status: "active" | "inactive" | "prospect" | "archived";
}): CreatePaymentClientOption {
  if (client.status === "archived") {
    throw new Error("Archived clients cannot become payment options.");
  }

  return {
    id: client.id,
    label: client.fullName,
  };
}

function toClientPackageOption(clientPackage: {
  id: string;
  clientId: string;
  packageName: string;
  status: "active" | "expired" | "depleted" | "cancelled";
}): CreatePaymentClientPackageOption {
  return {
    id: clientPackage.id,
    clientId: clientPackage.clientId,
    label: `${clientPackage.packageName} (${clientPackage.status})`,
  };
}

function toSafeOptionsErrorState(
  error: unknown,
  dataMode: "mock" | "supabase",
): CreatePaymentOptionsState {
  if (dataMode === "supabase" && isSupabaseConfigurationError(error)) {
    return { status: "configuration_error", dataMode };
  }

  if (dataMode === "supabase" && isPermissionError(error)) {
    return { status: "permission_denied", dataMode };
  }

  return { status: "error", dataMode };
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
