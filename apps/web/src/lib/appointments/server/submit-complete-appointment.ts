import "server-only";

import {
  completeAppointmentInputSchema,
  type Appointment,
  type CompleteAppointmentInput,
} from "@hom/domain/appointments";
import { z } from "zod";

import type { CompleteAppointmentActionState } from "@/features/appointments/complete-appointment-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  completeAppointment,
  CompleteAppointmentRpcError,
} from "./complete-appointment";

const completeAppointmentFormSchema = z
  .object({
    id: z.string().trim().min(1),
  })
  .strict();

type SubmitCompleteAppointmentOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  complete?: (input: CompleteAppointmentInput) => Promise<Appointment>;
};

export async function submitCompleteAppointmentFormData(
  formData: FormData,
  options: SubmitCompleteAppointmentOptions = {},
): Promise<CompleteAppointmentActionState> {
  if (
    (options.dataMode ?? getDataMode()) !== "supabase" ||
    (options.authMode ?? getAuthMode()) !== "supabase"
  ) {
    return {
      status: "configuration_error",
      message: "Completion is unavailable in mock preview mode.",
    };
  }

  try {
    const input = toCompleteAppointmentInput(formData);
    const appointment = await (options.complete ?? completeAppointment)(input);

    return {
      status: "success",
      appointmentId: appointment.id,
      message: "Appointment marked completed.",
    };
  } catch (error) {
    return toSafeCompleteAppointmentActionState(error);
  }
}

export function toCompleteAppointmentInput(formData: FormData) {
  return completeAppointmentInputSchema.parse(
    completeAppointmentFormSchema.parse({
      id: readFormText(formData, "id"),
    }),
  );
}

export function toSafeCompleteAppointmentActionState(
  error: unknown,
): CompleteAppointmentActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Select a valid appointment.",
    };
  }

  if (error instanceof CompleteAppointmentRpcError) {
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
    message: "Appointment could not be marked completed. Try again.",
  };
}

function mapRpcError(
  code: CompleteAppointmentRpcError["code"],
): CompleteAppointmentActionState {
  const resultByCode: Record<
    CompleteAppointmentRpcError["code"],
    CompleteAppointmentActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before marking an appointment completed.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for appointment changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to complete appointments.",
    },
    APPOINTMENT_NOT_FOUND: {
      status: "appointment_unavailable",
      message: "This appointment is no longer available.",
    },
    APPOINTMENT_NOT_COMPLETABLE: {
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be completed.",
    },
    COMPLETE_APPOINTMENT_FAILED: {
      status: "unknown_error",
      message: "Appointment could not be marked completed. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
