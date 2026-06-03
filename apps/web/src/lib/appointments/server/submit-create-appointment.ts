import "server-only";

import {
  createScheduledAppointmentInputSchema,
  type Appointment,
  type CreateScheduledAppointmentInput,
} from "@hom/domain/appointments";
import { z } from "zod";

import { toJakartaIsoTimestamp } from "@/features/appointments/create-appointment-time";
import type { CreateAppointmentActionState } from "@/features/appointments/create-appointment-types";
import { getAuthMode, getDataMode } from "@/lib/env/app-mode";

import {
  createScheduledAppointment,
  CreateAppointmentRpcError,
} from "./create-appointment";

const createAppointmentFormSchema = z
  .object({
    clientId: z.string().trim().min(1),
    practitionerId: z.string().trim().min(1),
    serviceId: z.string().trim().min(1),
    startsAtLocal: z.string().trim().min(1),
    source: z.literal("admin"),
    notesSummary: z.string().trim().max(280),
  })
  .strict();

type SubmitCreateAppointmentOptions = {
  dataMode?: "mock" | "supabase";
  authMode?: "mock" | "supabase";
  now?: Date;
  createAppointment?: (
    input: CreateScheduledAppointmentInput,
  ) => Promise<Appointment>;
};

export async function submitCreateAppointmentFormData(
  formData: FormData,
  options: SubmitCreateAppointmentOptions = {},
): Promise<CreateAppointmentActionState> {
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
    const input = toCreateScheduledAppointmentInput(
      formData,
      options.now ?? new Date(),
    );
    const appointment = await (
      options.createAppointment ?? createScheduledAppointment
    )(input);

    return {
      status: "success",
      appointmentId: appointment.id,
      message: "Appointment created.",
    };
  } catch (error) {
    return toSafeCreateAppointmentActionState(error);
  }
}

export function toCreateScheduledAppointmentInput(
  formData: FormData,
  now = new Date(),
) {
  const parsedForm = createAppointmentFormSchema.parse({
    clientId: readFormText(formData, "clientId"),
    practitionerId: readFormText(formData, "practitionerId"),
    serviceId: readFormText(formData, "serviceId"),
    startsAtLocal: readFormText(formData, "startsAtLocal"),
    source: readFormText(formData, "source"),
    notesSummary: readFormText(formData, "notesSummary"),
  });
  const startsAt = toJakartaIsoTimestamp(parsedForm.startsAtLocal);

  if (!startsAt || Date.parse(startsAt) <= now.getTime()) {
    throw new CreateAppointmentFormValidationError(
      "Choose a future appointment time.",
    );
  }

  return createScheduledAppointmentInputSchema.parse({
    clientId: parsedForm.clientId,
    practitionerId: parsedForm.practitionerId,
    serviceId: parsedForm.serviceId,
    startsAt,
    source: parsedForm.source,
    notesSummary: parsedForm.notesSummary || undefined,
  });
}

export function toSafeCreateAppointmentActionState(
  error: unknown,
): CreateAppointmentActionState {
  if (
    error instanceof CreateAppointmentFormValidationError ||
    error instanceof z.ZodError
  ) {
    return {
      status: "validation_error",
      message: "Check the appointment details and try again.",
    };
  }

  if (error instanceof CreateAppointmentRpcError) {
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
    message: "Appointment could not be created. Try again.",
  };
}

class CreateAppointmentFormValidationError extends Error {}

function mapRpcError(
  code: CreateAppointmentRpcError["code"],
): CreateAppointmentActionState {
  const resultByCode: Record<
    CreateAppointmentRpcError["code"],
    CreateAppointmentActionState
  > = {
    AUTH_REQUIRED: {
      status: "auth_required",
      message: "Sign in before creating an appointment.",
    },
    APP_USER_REQUIRED: {
      status: "app_user_required",
      message: "Your studio profile is not ready for appointment changes.",
    },
    PERMISSION_DENIED: {
      status: "permission_denied",
      message: "You do not have permission to create appointments.",
    },
    CLIENT_UNAVAILABLE: {
      status: "client_unavailable",
      message: "Choose an available client and try again.",
    },
    PRACTITIONER_UNAVAILABLE: {
      status: "practitioner_unavailable",
      message: "Choose an active practitioner and try again.",
    },
    SERVICE_UNAVAILABLE: {
      status: "service_unavailable",
      message: "Choose an active service and try again.",
    },
    APPOINTMENT_OVERLAP: {
      status: "appointment_overlap",
      message: "This practitioner already has an appointment during that time.",
    },
    START_TIME_REQUIRED: {
      status: "validation_error",
      message: "Choose a future appointment time.",
    },
    SOURCE_INVALID: {
      status: "validation_error",
      message: "The appointment source is invalid.",
    },
    NOTES_SUMMARY_INVALID: {
      status: "validation_error",
      message: "Keep the operational summary within 280 characters.",
    },
    CREATE_APPOINTMENT_FAILED: {
      status: "unknown_error",
      message: "Appointment could not be created. Try again.",
    },
  };

  return resultByCode[code];
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
