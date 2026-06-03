import "server-only";

import {
  assignClientPackageInputSchema,
  type AssignClientPackageInput,
  type ClientPackage,
} from "@hom/domain/packages";
import { z } from "zod";

import { toJakartaIsoTimestamp } from "@/features/appointments/create-appointment-time";
import type { AssignClientPackageActionState } from "@/features/packages/client-packages/assign-client-package-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  assignClientPackage,
  AssignClientPackageRpcError,
} from "./assign-client-package";

const assignClientPackageFormSchema = z
  .object({
    clientId: z.string().trim().min(1),
    packageId: z.string().trim().min(1),
    purchasedAtLocal: z.string().trim().min(1),
  })
  .strict();

type SubmitAssignClientPackageOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  assignPackage?: (input: AssignClientPackageInput) => Promise<ClientPackage>;
};

export async function submitAssignClientPackageFormData(
  formData: FormData,
  options: SubmitAssignClientPackageOptions = {},
): Promise<AssignClientPackageActionState> {
  if (
    (options.dataMode ?? getDataMode()) !== "supabase" ||
    (options.authMode ?? getAuthMode()) !== "supabase"
  ) {
    return {
      status: "configuration_error",
      message: "Saving is unavailable in mock preview mode.",
    };
  }

  try {
    const input = toAssignClientPackageInput(formData);
    const clientPackage = await (options.assignPackage ?? assignClientPackage)(
      input,
    );

    return {
      status: "success",
      clientPackageId: clientPackage.id,
      message: "Package assigned.",
    };
  } catch (error) {
    return toSafeAssignClientPackageActionState(error);
  }
}

export function toAssignClientPackageInput(formData: FormData) {
  const parsedForm = assignClientPackageFormSchema.parse({
    clientId: readFormText(formData, "clientId"),
    packageId: readFormText(formData, "packageId"),
    purchasedAtLocal: readFormText(formData, "purchasedAtLocal"),
  });
  const purchasedAt = toJakartaIsoTimestamp(parsedForm.purchasedAtLocal);

  if (!purchasedAt) {
    throw new AssignClientPackageFormValidationError(
      "Choose a valid purchase date.",
    );
  }

  return assignClientPackageInputSchema.parse({
    clientId: parsedForm.clientId,
    packageId: parsedForm.packageId,
    purchasedAt,
  });
}

export function toSafeAssignClientPackageActionState(
  error: unknown,
): AssignClientPackageActionState {
  if (
    error instanceof AssignClientPackageFormValidationError ||
    error instanceof z.ZodError
  ) {
    return {
      status: "validation_error",
      message: "Check the package assignment details and try again.",
    };
  }

  if (error instanceof AssignClientPackageRpcError) {
    return mapRpcError(error.code);
  }

  if (
    error instanceof Error &&
    error.message.includes("Supabase public environment variables are missing")
  ) {
    return {
      status: "configuration_error",
      message: "Local Supabase configuration is unavailable.",
    };
  }

  return {
    status: "unknown_error",
    message: "Package could not be assigned. Try again.",
  };
}

class AssignClientPackageFormValidationError extends Error {}

function mapRpcError(
  code: AssignClientPackageRpcError["code"],
): AssignClientPackageActionState {
  const resultByCode: Record<
    AssignClientPackageRpcError["code"],
    AssignClientPackageActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before assigning a package.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for package changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to assign packages.",
    },
    CLIENT_UNAVAILABLE: {
      status: "client_unavailable",
      message: "Choose an eligible client and try again.",
    },
    PACKAGE_UNAVAILABLE: {
      status: "package_unavailable",
      message: "Choose an active package and try again.",
    },
    PURCHASED_AT_REQUIRED: {
      status: "validation_error",
      message: "Choose a valid purchase date.",
    },
    ASSIGN_CLIENT_PACKAGE_FAILED: {
      status: "unknown_error",
      message: "Package could not be assigned. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
