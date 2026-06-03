import "server-only";

import {
  appointmentSchema,
  rescheduleAppointmentInputSchema,
  type Appointment,
} from "@hom/domain/appointments";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RescheduleAppointmentRpcParams = {
  p_appointment_id: string;
  p_starts_at: string;
  p_reason: string;
};

type RescheduleAppointmentRpcResponse = {
  data: RescheduleAppointmentRpcRow[] | null;
  error: unknown;
};

export type RescheduleAppointmentRpcClient = {
  rpc(
    functionName: "reschedule_appointment",
    params: RescheduleAppointmentRpcParams,
  ): PromiseLike<RescheduleAppointmentRpcResponse>;
};

type RescheduleAppointmentOptions = {
  createSupabaseClient?: () => Promise<RescheduleAppointmentRpcClient>;
};

type RescheduleAppointmentRpcRow = {
  id: string;
  client_id: string;
  client_name: string;
  practitioner_id: string;
  practitioner_name: string;
  service_id: string;
  service_name: string;
  status: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  source: string;
  notes_summary: string | null;
  created_at: string;
  updated_at: string;
};

const knownErrorCodes = [
  "AUTH_REQUIRED",
  "APP_USER_REQUIRED",
  "PERMISSION_DENIED",
  "APPOINTMENT_NOT_FOUND",
  "APPOINTMENT_NOT_RESCHEDULABLE",
  "START_TIME_INVALID",
  "RESCHEDULE_REASON_INVALID",
  "APPOINTMENT_OVERLAP",
] as const;

type KnownRescheduleAppointmentErrorCode = (typeof knownErrorCodes)[number];

export class RescheduleAppointmentRpcError extends Error {
  readonly code:
    | KnownRescheduleAppointmentErrorCode
    | "RESCHEDULE_APPOINTMENT_FAILED";

  constructor(
    code:
      | KnownRescheduleAppointmentErrorCode
      | "RESCHEDULE_APPOINTMENT_FAILED",
  ) {
    super("Appointment could not be rescheduled.");
    this.name = "RescheduleAppointmentRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new RescheduleAppointmentRpcError(
      code ?? "RESCHEDULE_APPOINTMENT_FAILED",
    );
  }
}

export async function rescheduleAppointment(
  input: unknown,
  options: RescheduleAppointmentOptions = {},
): Promise<Appointment> {
  const parsedInput = rescheduleAppointmentInputSchema.parse(input);

  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "appointment.rescheduled",
    targetType: "appointment",
    targetId: parsedInput.id,
    riskLevel: "high",
    metadata: {
      appointmentId: parsedInput.id,
      newStartsAt: parsedInput.startsAt,
    },
  });

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createRescheduleAppointmentRpcClient();
  const response = await supabase.rpc("reschedule_appointment", {
    p_appointment_id: parsedInput.id,
    p_starts_at: parsedInput.startsAt,
    p_reason: parsedInput.reason,
  });

  if (response.error) {
    throw RescheduleAppointmentRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new RescheduleAppointmentRpcError("RESCHEDULE_APPOINTMENT_FAILED");
  }

  return mapRescheduleAppointmentRpcRow(row);
}

function mapRescheduleAppointmentRpcRow(row: RescheduleAppointmentRpcRow) {
  return appointmentSchema.parse({
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    practitionerId: row.practitioner_id,
    practitionerName: row.practitioner_name,
    serviceId: row.service_id,
    serviceName: row.service_name,
    status: row.status,
    startsAt: toIsoTimestamp(row.starts_at),
    endsAt: toIsoTimestamp(row.ends_at),
    durationMinutes: row.duration_minutes,
    source: row.source,
    notesSummary: row.notes_summary ?? undefined,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

async function createRescheduleAppointmentRpcClient(): Promise<RescheduleAppointmentRpcClient> {
  return (await createSupabaseServerClient()) as unknown as RescheduleAppointmentRpcClient;
}

function readOptionalString(value: unknown, key: string) {
  if (!isRecord(value)) {
    return undefined;
  }

  const property = value[key];
  return typeof property === "string" ? property : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toIsoTimestamp(value: string) {
  const time = Date.parse(value);

  if (Number.isNaN(time)) {
    return value;
  }

  return new Date(time).toISOString();
}
