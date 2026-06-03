import "server-only";

import {
  markNoShowAppointmentInputSchema,
  type Appointment,
  type MarkNoShowAppointmentInput,
} from "@hom/domain/appointments";
import { z } from "zod";

import type { MarkNoShowAppointmentActionState } from "@/features/appointments/mark-no-show-appointment-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  markNoShowAppointment,
  MarkNoShowAppointmentRpcError,
} from "./mark-no-show-appointment";

const markNoShowAppointmentFormSchema = z
  .object({
    id: z.string().trim().min(1),
    reason: z.string().trim().max(280),
  })
  .strict();

type SubmitMarkNoShowAppointmentOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  markNoShow?: (input: MarkNoShowAppointmentInput) => Promise<Appointment>;
};

export async function submitMarkNoShowAppointmentFormData(
  formData: FormData,
  options: SubmitMarkNoShowAppointmentOptions = {},
): Promise<MarkNoShowAppointmentActionState> {
  if (
    (options.dataMode ?? getDataMode()) !== "supabase" ||
    (options.authMode ?? getAuthMode()) !== "supabase"
  ) {
    return {
      status: "configuration_error",
      message: "No-show marking is unavailable in mock preview mode.",
    };
  }

  try {
    const input = toMarkNoShowAppointmentInput(formData);
    const appointment = await (
      options.markNoShow ?? markNoShowAppointment
    )(input);

    return {
      status: "success",
      appointmentId: appointment.id,
      message: "Appointment marked no-show.",
    };
  } catch (error) {
    return toSafeMarkNoShowAppointmentActionState(error);
  }
}

export function toMarkNoShowAppointmentInput(formData: FormData) {
  const parsedForm = markNoShowAppointmentFormSchema.parse({
    id: readFormText(formData, "id"),
    reason: readFormText(formData, "reason"),
  });

  return markNoShowAppointmentInputSchema.parse({
    id: parsedForm.id,
    reason: parsedForm.reason || undefined,
  });
}

export function toSafeMarkNoShowAppointmentActionState(
  error: unknown,
): MarkNoShowAppointmentActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "validation_error",
      message: "Keep the optional no-show note within 280 characters.",
    };
  }

  if (error instanceof MarkNoShowAppointmentRpcError) {
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
    message: "Appointment could not be marked no-show. Try again.",
  };
}

function mapRpcError(
  code: MarkNoShowAppointmentRpcError["code"],
): MarkNoShowAppointmentActionState {
  const resultByCode: Record<
    MarkNoShowAppointmentRpcError["code"],
    MarkNoShowAppointmentActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before marking an appointment no-show.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for appointment changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to mark appointments no-show.",
    },
    APPOINTMENT_NOT_FOUND: {
      status: "appointment_unavailable",
      message: "This appointment is no longer available.",
    },
    APPOINTMENT_NOT_MARKABLE_NO_SHOW: {
      status: "appointment_unavailable",
      message: "Only scheduled or confirmed appointments can be marked no-show.",
    },
    NO_SHOW_REASON_INVALID: {
      status: "validation_error",
      message: "Keep the optional no-show note within 280 characters.",
    },
    MARK_NO_SHOW_APPOINTMENT_FAILED: {
      status: "unknown_error",
      message: "Appointment could not be marked no-show. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
