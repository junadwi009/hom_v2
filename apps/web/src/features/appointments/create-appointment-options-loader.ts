import type { CatalogRepositories } from "@/lib/catalog/repository-factory";
import { CatalogRepositoryError } from "@/lib/catalog/errors";
import { createCatalogRepositories } from "@/lib/catalog/repository-factory";
import { getDataMode } from "@/lib/env/app-mode";

import type {
  AppointmentClientOption,
  AppointmentPractitionerOption,
  AppointmentServiceOption,
  CreateAppointmentOptionsState,
} from "./create-appointment-types";

type LoadCreateAppointmentOptionsOptions = {
  repositories?: CatalogRepositories;
  dataMode?: "mock" | "supabase";
};

export async function loadCreateAppointmentOptions(
  loaderOptions: LoadCreateAppointmentOptionsOptions = {},
): Promise<CreateAppointmentOptionsState> {
  const dataMode = loaderOptions.dataMode ?? getDataMode();

  try {
    const repositories =
      loaderOptions.repositories ?? (await createCatalogRepositories());
    const [clients, practitioners, services] = await Promise.all([
      repositories.clients.list({ page: 1, pageSize: 100 }),
      repositories.practitioners.list({
        status: "active",
        page: 1,
        pageSize: 100,
      }),
      repositories.services.list({
        status: "active",
        page: 1,
        pageSize: 100,
      }),
    ]);

    return {
      status: "ready",
      dataMode,
      options: {
        clients: clients.items
          .filter((client) => client.status !== "archived")
          .map(toClientOption),
        practitioners: practitioners.items
          .filter((practitioner) => practitioner.status === "active")
          .map(toPractitionerOption),
        services: services.items
          .filter((service) => service.status === "active")
          .map(toServiceOption),
      },
    };
  } catch (error) {
    return toSafeOptionsErrorState(error, dataMode);
  }
}

function toClientOption(client: {
  id: string;
  fullName: string;
  status: "active" | "inactive" | "prospect" | "archived";
}): AppointmentClientOption {
  if (client.status === "archived") {
    throw new Error("Archived clients cannot become appointment options.");
  }

  return {
    id: client.id,
    label: client.fullName,
    status: client.status,
  };
}

function toPractitionerOption(practitioner: {
  id: string;
  displayName: string;
  status: "active" | "inactive" | "archived";
}): AppointmentPractitionerOption {
  if (practitioner.status !== "active") {
    throw new Error("Inactive practitioners cannot become appointment options.");
  }

  return {
    id: practitioner.id,
    label: practitioner.displayName,
    status: practitioner.status,
  };
}

function toServiceOption(service: {
  id: string;
  name: string;
  status: "active" | "inactive" | "archived";
  defaultDurationMinutes: number;
}): AppointmentServiceOption {
  if (service.status !== "active") {
    throw new Error("Inactive services cannot become appointment options.");
  }

  return {
    id: service.id,
    label: service.name,
    status: service.status,
    durationMinutes: service.defaultDurationMinutes,
  };
}

function toSafeOptionsErrorState(
  error: unknown,
  dataMode: "mock" | "supabase",
): CreateAppointmentOptionsState {
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
