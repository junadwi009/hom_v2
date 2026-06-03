import "server-only";

import {
  appointmentSchema,
  cancelAppointmentInputSchema,
  type Appointment,
} from "@hom/domain/appointments";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CancelAppointmentRpcParams = {
  p_appointment_id: string;
  p_reason: string;
};

type CancelAppointmentRpcResponse = {
  data: CancelAppointmentRpcRow[] | null;
  error: unknown;
};

export type CancelAppointmentRpcClient = {
  rpc(
    functionName: "cancel_appointment",
    params: CancelAppointmentRpcParams,
  ): PromiseLike<CancelAppointmentRpcResponse>;
};

type CancelAppointmentOptions = {
  createSupabaseClient?: () => Promise<CancelAppointmentRpcClient>;
};

type CancelAppointmentRpcRow = {
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
  "APPOINTMENT_NOT_CANCELLABLE",
  "CANCELLATION_REASON_INVALID",
] as const;

type KnownCancelAppointmentErrorCode = (typeof knownErrorCodes)[number];

export class CancelAppointmentRpcError extends Error {
  readonly code: KnownCancelAppointmentErrorCode | "CANCEL_APPOINTMENT_FAILED";

  constructor(
    code: KnownCancelAppointmentErrorCode | "CANCEL_APPOINTMENT_FAILED",
  ) {
    super("Appointment could not be cancelled.");
    this.name = "CancelAppointmentRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new CancelAppointmentRpcError(code ?? "CANCEL_APPOINTMENT_FAILED");
  }
}

export async function cancelAppointment(
  input: unknown,
  options: CancelAppointmentOptions = {},
): Promise<Appointment> {
  const parsedInput = cancelAppointmentInputSchema.parse(input);

  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "appointment.cancelled",
    targetType: "appointment",
    targetId: parsedInput.id,
    riskLevel: "high",
    metadata: {
      appointmentId: parsedInput.id,
    },
  });

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createCancelAppointmentRpcClient();
  const response = await supabase.rpc("cancel_appointment", {
    p_appointment_id: parsedInput.id,
    p_reason: parsedInput.reason,
  });

  if (response.error) {
    throw CancelAppointmentRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new CancelAppointmentRpcError("CANCEL_APPOINTMENT_FAILED");
  }

  return mapCancelAppointmentRpcRow(row);
}

function mapCancelAppointmentRpcRow(row: CancelAppointmentRpcRow) {
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

async function createCancelAppointmentRpcClient(): Promise<CancelAppointmentRpcClient> {
  return (await createSupabaseServerClient()) as unknown as CancelAppointmentRpcClient;
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
