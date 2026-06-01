import type { AppointmentRepository } from "@hom/domain/appointments";

import { AppointmentRepositoryError } from "@/lib/appointments/errors";
import { createAppointmentRepository } from "@/lib/appointments/repository-factory";
import { getDataMode } from "@/lib/env/app-mode";

import {
  toAppointmentTableRow,
  type AppointmentDataSource,
  type AppointmentsPageState,
} from "./appointments-page-state";

type LoadAppointmentsPageOptions = {
  repository?: AppointmentRepository;
  source?: AppointmentDataSource;
};

const DEFAULT_APPOINTMENT_LIST_QUERY = {
  page: 1,
  pageSize: 20,
} as const;

export async function loadAppointmentsPage(
  options: LoadAppointmentsPageOptions = {},
): Promise<AppointmentsPageState> {
  const source = options.source ?? getDataMode();

  try {
    const repository =
      options.repository ?? (await createAppointmentRepository());
    const result = await repository.list(DEFAULT_APPOINTMENT_LIST_QUERY);

    if (result.total === 0) {
      return {
        status: "empty",
        source,
      };
    }

    return {
      status: "ready",
      source,
      rows: result.items.map(toAppointmentTableRow),
      total: result.total,
      pageSize: result.pageSize,
    };
  } catch (error) {
    return toSafeAppointmentsPageErrorState(error, source);
  }
}

function toSafeAppointmentsPageErrorState(
  error: unknown,
  source: AppointmentDataSource,
): AppointmentsPageState {
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
    error instanceof AppointmentRepositoryError &&
    (error.code === "42501" || error.status === 401 || error.status === 403)
  );
}

function isSupabaseConfigurationError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Supabase public environment variables are missing")
  );
}

export function createEmptyAppointmentRepository(): AppointmentRepository {
  return {
    async list() {
      return {
        items: [],
        total: 0,
        page: DEFAULT_APPOINTMENT_LIST_QUERY.page,
        pageSize: DEFAULT_APPOINTMENT_LIST_QUERY.pageSize,
      };
    },
    async getById() {
      return null;
    },
  };
}
