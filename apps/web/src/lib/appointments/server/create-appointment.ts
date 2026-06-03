import "server-only";

import {
  appointmentSchema,
  createScheduledAppointmentInputSchema,
  type Appointment,
} from "@hom/domain/appointments";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CreateAppointmentRpcParams = {
  p_client_id: string;
  p_practitioner_id: string;
  p_service_id: string;
  p_starts_at: string;
  p_source: string;
  p_notes_summary: string | null;
};

type CreateAppointmentRpcResponse = {
  data: CreateAppointmentRpcRow[] | null;
  error: unknown;
};

export type CreateAppointmentRpcClient = {
  rpc(
    functionName: "create_appointment",
    params: CreateAppointmentRpcParams,
  ): PromiseLike<CreateAppointmentRpcResponse>;
};

type CreateAppointmentOptions = {
  createSupabaseClient?: () => Promise<CreateAppointmentRpcClient>;
};

type CreateAppointmentRpcRow = {
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
  "CLIENT_UNAVAILABLE",
  "PRACTITIONER_UNAVAILABLE",
  "SERVICE_UNAVAILABLE",
  "START_TIME_REQUIRED",
  "SOURCE_INVALID",
  "NOTES_SUMMARY_INVALID",
  "APPOINTMENT_OVERLAP",
] as const;

type KnownCreateAppointmentErrorCode = (typeof knownErrorCodes)[number];

export class CreateAppointmentRpcError extends Error {
  readonly code: KnownCreateAppointmentErrorCode | "CREATE_APPOINTMENT_FAILED";

  constructor(
    code: KnownCreateAppointmentErrorCode | "CREATE_APPOINTMENT_FAILED",
  ) {
    super("Appointment could not be created.");
    this.name = "CreateAppointmentRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new CreateAppointmentRpcError(code ?? "CREATE_APPOINTMENT_FAILED");
  }
}

export async function createScheduledAppointment(
  input: unknown,
  options: CreateAppointmentOptions = {},
): Promise<Appointment> {
  const parsedInput = createScheduledAppointmentInputSchema.parse(input);

  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "appointment.created",
    targetType: "appointment",
    targetId: null,
    riskLevel: "high",
    metadata: {
      source: parsedInput.source,
      clientId: parsedInput.clientId,
      practitionerId: parsedInput.practitionerId,
      serviceId: parsedInput.serviceId,
      startsAt: parsedInput.startsAt,
    },
  });

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createAppointmentRpcClient();
  const response = await supabase.rpc("create_appointment", {
    p_client_id: parsedInput.clientId,
    p_practitioner_id: parsedInput.practitionerId,
    p_service_id: parsedInput.serviceId,
    p_starts_at: parsedInput.startsAt,
    p_source: parsedInput.source,
    p_notes_summary: parsedInput.notesSummary ?? null,
  });

  if (response.error) {
    throw CreateAppointmentRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new CreateAppointmentRpcError("CREATE_APPOINTMENT_FAILED");
  }

  return mapCreateAppointmentRpcRow(row);
}

function mapCreateAppointmentRpcRow(row: CreateAppointmentRpcRow) {
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

async function createAppointmentRpcClient(): Promise<CreateAppointmentRpcClient> {
  return (await createSupabaseServerClient()) as unknown as CreateAppointmentRpcClient;
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
