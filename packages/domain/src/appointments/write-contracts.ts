import type { AuditLogInput, AuditMetadata } from "../audit";
import type { PermissionKey } from "../rbac";
import type {
  Appointment,
  AppointmentStatus,
  CancelAppointmentInput,
  CompleteAppointmentInput,
  CreateScheduledAppointmentInput,
  MarkNoShowAppointmentInput,
  RescheduleAppointmentInput,
} from "./types";

export type AppointmentWriteActor = {
  appUserId: string;
  authUserId: string | null;
  permissions: readonly PermissionKey[];
};

export type CreateAppointmentUseCase = {
  execute(
    input: CreateScheduledAppointmentInput,
    actor: AppointmentWriteActor,
  ): Promise<Appointment>;
};

export type RescheduleAppointmentUseCase = {
  execute(
    input: RescheduleAppointmentInput,
    actor: AppointmentWriteActor,
  ): Promise<Appointment>;
};

export type CancelAppointmentUseCase = {
  execute(
    input: CancelAppointmentInput,
    actor: AppointmentWriteActor,
  ): Promise<Appointment>;
};

export type CompleteAppointmentUseCase = {
  execute(
    input: CompleteAppointmentInput,
    actor: AppointmentWriteActor,
  ): Promise<Appointment>;
};

export type MarkNoShowAppointmentUseCase = {
  execute(
    input: MarkNoShowAppointmentInput,
    actor: AppointmentWriteActor,
  ): Promise<Appointment>;
};

export type AppointmentCreateWrite = CreateScheduledAppointmentInput & {
  status: "scheduled";
  createdByAppUserId: string;
  updatedByAppUserId: string;
};

export type AppointmentUpdateWrite = {
  id: string;
  status?: AppointmentStatus;
  startsAt?: string;
  endsAt?: string;
  durationMinutes?: number;
  cancellationReason?: string | null;
  rescheduleReason?: string | null;
  updatedByAppUserId: string;
};

export type AppointmentStatusHistoryWrite = {
  appointmentId: string;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus;
  reason?: string | null;
  actorAppUserId: string;
  metadata?: AuditMetadata;
};

export type AppointmentAuditLogSink = {
  append(input: AuditLogInput): Promise<void>;
};

export type AppointmentWriteTransaction = {
  insertAppointment(input: AppointmentCreateWrite): Promise<Appointment>;
  updateAppointment(input: AppointmentUpdateWrite): Promise<Appointment>;
  insertStatusHistory(input: AppointmentStatusHistoryWrite): Promise<void>;
  readonly auditLogSink: AppointmentAuditLogSink;
};

export type AppointmentWriteTransactionAdapter = {
  runInTransaction<TResult>(
    operation: (transaction: AppointmentWriteTransaction) => Promise<TResult>,
  ): Promise<TResult>;
};
