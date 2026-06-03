import "server-only";

import {
  rescheduleAppointmentInputSchema,
  type Appointment,
  type RescheduleAppointmentInput,
} from "@hom/domain/appointments";
import { z } from "zod";

import { toJakartaIsoTimestamp } from "@/features/appointments/create-appointment-time";
import type { RescheduleAppointmentActionState } from "@/features/appointments/reschedule-appointment-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  rescheduleAppointment,
  RescheduleAppointmentRpcError,
} from "./reschedule-appointment";

const rescheduleAppointmentFormSchema = z
  .object({
    id: z.string().trim().min(1),
    startsAtLocal: z.string().trim().min(1),
    reason: z.string().trim().min(1).max(280),
  })
  .strict();

type SubmitRescheduleAppointmentOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  now?: Date;
  reschedule?: (input: RescheduleAppointmentInput) => Promise<Appointment>;
};

export async function submitRescheduleAppointmentFormData(
  formData: FormData,
  options: SubmitRescheduleAppointmentOptions = {},
): Promise<RescheduleAppointmentActionState> {
  if (
    (options.dataMode ?? getDataMode()) !== "supabase" ||
    (options.authMode ?? getAuthMode()) !== "supabase"
  ) {
    return {
      status: "configuration_error",
      message: "Rescheduling is unavailable in mock preview mode.",
    };
  }

  try {
    const input = toRescheduleAppointmentInput(
      formData,
      options.now ?? new Date(),
    );
    const appointment = await (
      options.reschedule ?? rescheduleAppointment
    )(input);

    return {
      status: "success",
      appointmentId: appointment.id,
      message: "Appointment rescheduled.",
    };
  } catch (error) {
    return toSafeRescheduleAppointmentActionState(error);
  }
}

export function toRescheduleAppointmentInput(
  formData: FormData,
  now = new Date(),
) {
  const parsedForm = rescheduleAppointmentFormSchema.parse({
    id: readFormText(formData, "id"),
    startsAtLocal: readFormText(formData, "startsAtLocal"),
    reason: readFormText(formData, "reason"),
  });
  const startsAt = toJakartaIsoTimestamp(parsedForm.startsAtLocal);

  if (!startsAt || Date.parse(startsAt) <= now.getTime()) {
    throw new RescheduleAppointmentFormValidationError(
      "Choose a future appointment time.",
    );
  }

  return rescheduleAppointmentInputSchema.parse({
    id: parsedForm.id,
    startsAt,
    reason: parsedForm.reason,
  });
}

export function toSafeRescheduleAppointmentActionState(
  error: unknown,
): RescheduleAppointmentActionState {
  if (
    error instanceof RescheduleAppointmentFormValidationError ||
    error instanceof z.ZodError
  ) {
    return {
      status: "validation_error",
      message: "Choose a future start time and enter a reason within 280 characters.",
    };
  }

  if (error instanceof RescheduleAppointmentRpcError) {
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
    message: "Appointment could not be rescheduled. Try again.",
  };
}

class RescheduleAppointmentFormValidationError extends Error {}

function mapRpcError(
  code: RescheduleAppointmentRpcError["code"],
): RescheduleAppointmentActionState {
  const resultByCode: Record<
    RescheduleAppointmentRpcError["code"],
    RescheduleAppointmentActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before rescheduling an appointment.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for appointment changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to reschedule appointments.",
    },
    APPOINTMENT_NOT_FOUND: {
      status: "appointment_unavailable",
      message: "This appointment is no longer available.",
    },
    APPOINTMENT_NOT_RESCHEDULABLE: {
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be rescheduled.",
    },
    START_TIME_INVALID: {
      status: "validation_error",
      message: "Choose a future appointment time.",
    },
    RESCHEDULE_REASON_INVALID: {
      status: "validation_error",
      message: "Enter a reschedule reason within 280 characters.",
    },
    APPOINTMENT_OVERLAP: {
      status: "appointment_overlap",
      message: "This practitioner already has an appointment during that time.",
    },
    RESCHEDULE_APPOINTMENT_FAILED: {
      status: "unknown_error",
      message: "Appointment could not be rescheduled. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
