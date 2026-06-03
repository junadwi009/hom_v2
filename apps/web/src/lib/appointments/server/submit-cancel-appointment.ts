import "server-only";

import {
  cancelAppointmentInputSchema,
  type Appointment,
  type CancelAppointmentInput,
} from "@hom/domain/appointments";
import { z } from "zod";

import type { CancelAppointmentActionState } from "@/features/appointments/cancel-appointment-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  cancelAppointment,
  CancelAppointmentRpcError,
} from "./cancel-appointment";

const cancelAppointmentFormSchema = z
  .object({
    id: z.string().trim().min(1),
    reason: z.string().trim().min(1).max(280),
  })
  .strict();

type SubmitCancelAppointmentOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  cancel?: (input: CancelAppointmentInput) => Promise<Appointment>;
};

export async function submitCancelAppointmentFormData(
  formData: FormData,
  options: SubmitCancelAppointmentOptions = {},
): Promise<CancelAppointmentActionState> {
  if (
    (options.dataMode ?? getDataMode()) !== "supabase" ||
    (options.authMode ?? getAuthMode()) !== "supabase"
  ) {
    return {
      status: "configuration_error",
      message: "Cancellation is unavailable in mock preview mode.",
    };
  }

  try {
    const input = toCancelAppointmentInput(formData);
    const appointment = await (options.cancel ?? cancelAppointment)(input);

    return {
      status: "success",
      appointmentId: appointment.id,
      message: "Appointment cancelled.",
    };
  } catch (error) {
    return toSafeCancelAppointmentActionState(error);
  }
}

export function toCancelAppointmentInput(formData: FormData) {
  const parsedForm = cancelAppointmentFormSchema.parse({
    id: readFormText(formData, "id"),
    reason: readFormText(formData, "reason"),
  });

  return cancelAppointmentInputSchema.parse(parsedForm);
}

export function toSafeCancelAppointmentActionState(
  error: unknown,
): CancelAppointmentActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Enter a cancellation reason within 280 characters.",
    };
  }

  if (error instanceof CancelAppointmentRpcError) {
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
    message: "Appointment could not be cancelled. Try again.",
  };
}

function mapRpcError(
  code: CancelAppointmentRpcError["code"],
): CancelAppointmentActionState {
  const resultByCode: Record<
    CancelAppointmentRpcError["code"],
    CancelAppointmentActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before cancelling an appointment.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for appointment changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to cancel appointments.",
    },
    APPOINTMENT_NOT_FOUND: {
      status: "appointment_unavailable",
      message: "This appointment is no longer available.",
    },
    APPOINTMENT_NOT_CANCELLABLE: {
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be cancelled.",
    },
    CANCELLATION_REASON_INVALID: {
      status: "validation_error",
      message: "Enter a cancellation reason within 280 characters.",
    },
    CANCEL_APPOINTMENT_FAILED: {
      status: "unknown_error",
      message: "Appointment could not be cancelled. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
