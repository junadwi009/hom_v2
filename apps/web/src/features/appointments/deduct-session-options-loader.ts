import type { ClientPackage } from "@hom/domain/packages";

import { getDataMode } from "@/lib/env/app-mode";
import { PackageRepositoryError } from "@/lib/packages/errors";
import {
  createPackageRepositories,
  type PackageRepositories,
} from "@/lib/packages/repository-factory";

import type {
  DeductSessionOptionsState,
  DeductSessionPackageOption,
} from "./deduct-session-types";

type DeductSessionRepositories = Pick<
  PackageRepositories,
  "clientPackages" | "packageUsageHistory"
>;

type LoadDeductSessionOptionsInput = {
  appointmentId: string;
  clientId: string;
};

type LoadDeductSessionOptionsConfig = {
  repositories?: DeductSessionRepositories;
  dataMode?: "mock" | "supabase";
  now?: Date;
};

const ELIGIBLE_PACKAGE_QUERY = {
  status: "active",
  page: 1,
  pageSize: 100,
} as const;

const DEDUCTED_USAGE_QUERY = {
  changeType: "deducted",
  page: 1,
  pageSize: 100,
} as const;

export async function loadDeductSessionOptions(
  input: LoadDeductSessionOptionsInput,
  config: LoadDeductSessionOptionsConfig = {},
): Promise<DeductSessionOptionsState> {
  const dataMode = config.dataMode ?? getDataMode();
  const now = config.now ?? new Date();

  try {
    const repositories = config.repositories ?? (await createPackageRepositories());

    const [clientPackages, deductedUsage] = await Promise.all([
      repositories.clientPackages.list({
        ...ELIGIBLE_PACKAGE_QUERY,
        clientId: input.clientId,
      }),
      repositories.packageUsageHistory.list({
        ...DEDUCTED_USAGE_QUERY,
        appointmentId: input.appointmentId,
      }),
    ]);

    const alreadyDeducted = deductedUsage.items.some(
      (usage) =>
        usage.appointmentId === input.appointmentId &&
        usage.changeType === "deducted",
    );

    return {
      status: "ready",
      dataMode,
      alreadyDeducted,
      packages: filterEligibleDeductPackages(
        clientPackages.items,
        input.clientId,
        now,
      ).map(toDeductSessionPackageOption),
    };
  } catch (error) {
    return toSafeDeductSessionOptionsErrorState(error, dataMode);
  }
}

export async function loadDeductSessionOptionsByAppointment(
  appointments: LoadDeductSessionOptionsInput[],
  config: LoadDeductSessionOptionsConfig = {},
): Promise<Record<string, DeductSessionOptionsState>> {
  if (appointments.length === 0) {
    return {};
  }

  const dataMode = config.dataMode ?? getDataMode();

  let repositories: DeductSessionRepositories;

  try {
    repositories = config.repositories ?? (await createPackageRepositories());
  } catch (error) {
    const fallback = toSafeDeductSessionOptionsErrorState(error, dataMode);
    return Object.fromEntries(
      appointments.map((appointment) => [appointment.appointmentId, fallback]),
    );
  }

  const entries = await Promise.all(
    appointments.map(async (appointment) => {
      const state = await loadDeductSessionOptions(appointment, {
        ...config,
        repositories,
        dataMode,
      });
      return [appointment.appointmentId, state] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export function filterEligibleDeductPackages(
  clientPackages: ClientPackage[],
  clientId: string,
  now: Date,
): ClientPackage[] {
  return clientPackages.filter((clientPackage) => {
    if (clientPackage.clientId !== clientId) {
      return false;
    }

    if (clientPackage.status !== "active") {
      return false;
    }

    if (clientPackage.remainingSessions <= 0) {
      return false;
    }

    const expiresAt = Date.parse(clientPackage.expiresAt);

    if (!Number.isNaN(expiresAt) && expiresAt < now.getTime()) {
      return false;
    }

    return true;
  });
}

function toDeductSessionPackageOption(
  clientPackage: ClientPackage,
): DeductSessionPackageOption {
  return {
    id: clientPackage.id,
    packageName: clientPackage.packageName,
    remainingSessions: clientPackage.remainingSessions,
    totalSessions: clientPackage.totalSessions,
    expiresAt: clientPackage.expiresAt,
  };
}

function toSafeDeductSessionOptionsErrorState(
  error: unknown,
  dataMode: "mock" | "supabase",
): DeductSessionOptionsState {
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
