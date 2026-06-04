import "server-only";

import {
  deductClientPackageSessionInputSchema,
  type ClientPackage,
  type DeductClientPackageSessionInput,
} from "@hom/domain/packages";
import { z } from "zod";

import type { DeductSessionActionState } from "@/features/appointments/deduct-session-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  deductClientPackageSession,
  DeductClientPackageSessionRpcError,
} from "./deduct-client-package-session";

const deductSessionFormSchema = z
  .object({
    appointmentId: z.string().trim().min(1),
    clientPackageId: z.string().trim().min(1),
  })
  .strict();

type SubmitDeductSessionOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  deductSession?: (
    input: DeductClientPackageSessionInput,
  ) => Promise<ClientPackage>;
};

export async function submitDeductSessionFormData(
  formData: FormData,
  options: SubmitDeductSessionOptions = {},
): Promise<DeductSessionActionState> {
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
    const input = toDeductSessionInput(formData);
    const clientPackage = await (
      options.deductSession ?? deductClientPackageSession
    )(input);

    return {
      status: "success",
      clientPackageId: clientPackage.id,
      message: "Session deducted.",
    };
  } catch (error) {
    return toSafeDeductSessionActionState(error);
  }
}

export function toDeductSessionInput(formData: FormData) {
  const parsedForm = deductSessionFormSchema.parse({
    appointmentId: readFormText(formData, "appointmentId"),
    clientPackageId: readFormText(formData, "clientPackageId"),
  });

  return deductClientPackageSessionInputSchema.parse({
    appointmentId: parsedForm.appointmentId,
    clientPackageId: parsedForm.clientPackageId,
  });
}

export function toSafeDeductSessionActionState(
  error: unknown,
): DeductSessionActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Check the deduction details and try again.",
    };
  }

  if (error instanceof DeductClientPackageSessionRpcError) {
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
    message: "Session could not be deducted. Try again.",
  };
}

function mapRpcError(
  code: DeductClientPackageSessionRpcError["code"],
): DeductSessionActionState {
  const resultByCode: Record<
    DeductClientPackageSessionRpcError["code"],
    DeductSessionActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before deducting a session.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for package changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to deduct sessions.",
    },
    APPOINTMENT_NOT_FOUND: {
      status: "appointment_not_completed",
      message: "Only a completed appointment can deduct a session.",
    },
    APPOINTMENT_NOT_COMPLETED: {
      status: "appointment_not_completed",
      message: "Only a completed appointment can deduct a session.",
    },
    CLIENT_PACKAGE_UNAVAILABLE: {
      status: "package_unavailable",
      message: "Choose an eligible active package and try again.",
    },
    ALREADY_DEDUCTED: {
      status: "already_deducted",
      message: "This appointment has already deducted a session.",
    },
    DEDUCT_CLIENT_PACKAGE_SESSION_FAILED: {
      status: "unknown_error",
      message: "Session could not be deducted. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
