import "server-only";

import {
  appointmentSchema,
  markNoShowAppointmentInputSchema,
  type Appointment,
} from "@hom/domain/appointments";

import { prepareServerAuditLogInput } from "@/lib/audit/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MarkNoShowAppointmentRpcParams = {
  p_appointment_id: string;
  p_reason: string | null;
};

type MarkNoShowAppointmentRpcResponse = {
  data: MarkNoShowAppointmentRpcRow[] | null;
  error: unknown;
};

export type MarkNoShowAppointmentRpcClient = {
  rpc(
    functionName: "mark_appointment_no_show",
    params: MarkNoShowAppointmentRpcParams,
  ): PromiseLike<MarkNoShowAppointmentRpcResponse>;
};

type MarkNoShowAppointmentOptions = {
  createSupabaseClient?: () => Promise<MarkNoShowAppointmentRpcClient>;
};

type MarkNoShowAppointmentRpcRow = {
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
  "APPOINTMENT_NOT_MARKABLE_NO_SHOW",
  "NO_SHOW_REASON_INVALID",
] as const;

type KnownMarkNoShowAppointmentErrorCode = (typeof knownErrorCodes)[number];

export class MarkNoShowAppointmentRpcError extends Error {
  readonly code:
    | KnownMarkNoShowAppointmentErrorCode
    | "MARK_NO_SHOW_APPOINTMENT_FAILED";

  constructor(
    code:
      | KnownMarkNoShowAppointmentErrorCode
      | "MARK_NO_SHOW_APPOINTMENT_FAILED",
  ) {
    super("Appointment could not be marked no-show.");
    this.name = "MarkNoShowAppointmentRpcError";
    this.code = code;
  }

  static fromSupabase(error: unknown) {
    const message = readOptionalString(error, "message");
    const code = knownErrorCodes.find((candidate) =>
      message?.includes(candidate),
    );

    return new MarkNoShowAppointmentRpcError(
      code ?? "MARK_NO_SHOW_APPOINTMENT_FAILED",
    );
  }
}

export async function markNoShowAppointment(
  input: unknown,
  options: MarkNoShowAppointmentOptions = {},
): Promise<Appointment> {
  const parsedInput = markNoShowAppointmentInputSchema.parse(input);

  prepareServerAuditLogInput({
    actorUserId: null,
    actorAuthUserId: null,
    action: "appointment.no_show_marked",
    targetType: "appointment",
    targetId: parsedInput.id,
    riskLevel: "high",
    metadata: {
      appointmentId: parsedInput.id,
    },
  });

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createMarkNoShowAppointmentRpcClient();
  const response = await supabase.rpc("mark_appointment_no_show", {
    p_appointment_id: parsedInput.id,
    p_reason: parsedInput.reason ?? null,
  });

  if (response.error) {
    throw MarkNoShowAppointmentRpcError.fromSupabase(response.error);
  }

  const row = response.data?.[0];

  if (!row) {
    throw new MarkNoShowAppointmentRpcError("MARK_NO_SHOW_APPOINTMENT_FAILED");
  }

  return mapMarkNoShowAppointmentRpcRow(row);
}

function mapMarkNoShowAppointmentRpcRow(row: MarkNoShowAppointmentRpcRow) {
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

async function createMarkNoShowAppointmentRpcClient(): Promise<MarkNoShowAppointmentRpcClient> {
  return (await createSupabaseServerClient()) as unknown as MarkNoShowAppointmentRpcClient;
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
