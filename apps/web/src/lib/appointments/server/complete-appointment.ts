import "server-only";

import {
  appointmentSchema,
  completeAppointmentInputSchema,
  type Appointment,
} from "@hom/domain/appointments";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CompleteAppointmentRpcParams = {
  p_appointment_id: string;
};

type CompleteAppointmentRpcResponse = {
  data: CompleteAppointmentRpcRow[] | null;
  error: unknown;
};

export type CompleteAppointmentRpcClient = {
  rpc(
    functionName: "complete_appointment",
    params: CompleteAppointmentRpcParams,
  ): PromiseLike<CompleteAppointmentRpcResponse>;
};

type CompleteAppointmentOptions = {
  createSupabaseClient?: () => Promise<CompleteAppointmentRpcClient>;
};

type CompleteAppointmentRpcRow = {
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
  "APPOINTMENT_NOT_COMPLETABLE",
] as const;

type KnownCompleteAppointmentErrorCode = (typeof knownErrorCodes)[number];

export class CompleteAppointmentRpcError extends Error {
  readonly code:
    | KnownCompleteAppointmentErrorCode
    | "COMPLETE_APPOINTMENT_FAILED";

  constructor(
    code:
      | KnownCompleteAppointmentErrorCode
      | "COMPLETE_APPOINTMENT_FAILED",
  ) {
    super("Appointment could not be marked completed.");
    this.name = "CompleteAppointmentRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new CompleteAppointmentRpcError(
      code ?? "COMPLETE_APPOINTMENT_FAILED",
    );
  }
}

export async function completeAppointment(
  input: unknown,
  options: CompleteAppointmentOptions = {},
): Promise<Appointment> {
  const parsedInput = completeAppointmentInputSchema.parse(input);

  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "appointment.completed",
    targetType: "appointment",
    targetId: parsedInput.id,
    riskLevel: "high",
    metadata: {
      appointmentId: parsedInput.id,
    },
  });

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createCompleteAppointmentRpcClient();
  const response = await supabase.rpc("complete_appointment", {
    p_appointment_id: parsedInput.id,
  });

  if (response.error) {
    throw CompleteAppointmentRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new CompleteAppointmentRpcError("COMPLETE_APPOINTMENT_FAILED");
  }

  return mapCompleteAppointmentRpcRow(row);
}

function mapCompleteAppointmentRpcRow(row: CompleteAppointmentRpcRow) {
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

async function createCompleteAppointmentRpcClient(): Promise<CompleteAppointmentRpcClient> {
  return (await createSupabaseServerClient()) as unknown as CompleteAppointmentRpcClient;
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
  return Number.isNaN(time) ? value : new Date(time).toISOString();
}
