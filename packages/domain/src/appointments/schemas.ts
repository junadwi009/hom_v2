import { z } from "zod";

import {
  catalogIdSchema,
  catalogListQueryBaseSchema,
  catalogListResultMetaSchema,
  catalogTimestampSchema,
} from "../catalog";

export const appointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentSourceSchema = z.enum([
  "admin",
  "import",
  "whatsapp_request",
  "ai_draft",
]);

const durationMinutesSchema = z.number().int().min(1).max(480);
const operationalNotesSummarySchema = z.string().trim().min(1).max(280);
const operationalReasonSchema = z.string().trim().min(1).max(500);
const cancellationReasonSchema = z.string().trim().min(1).max(280);
const rescheduleReasonSchema = z.string().trim().min(1).max(280);
const noShowReasonSchema = z.string().trim().min(1).max(280);

function hasValidTimeWindow({
  startsAt,
  endsAt,
}: {
  startsAt: string;
  endsAt: string;
}) {
  return Date.parse(endsAt) > Date.parse(startsAt);
}

export const appointmentSchema = z
  .object({
    id: catalogIdSchema,
    clientId: catalogIdSchema,
    clientName: z.string().trim().min(1).max(120),
    practitionerId: catalogIdSchema,
    practitionerName: z.string().trim().min(1).max(120),
    serviceId: catalogIdSchema,
    serviceName: z.string().trim().min(1).max(120),
    status: appointmentStatusSchema,
    startsAt: catalogTimestampSchema,
    endsAt: catalogTimestampSchema,
    durationMinutes: durationMinutesSchema,
    source: appointmentSourceSchema,
    notesSummary: operationalNotesSummarySchema.optional(),
    createdAt: catalogTimestampSchema,
    updatedAt: catalogTimestampSchema,
  })
  .strict()
  .refine(hasValidTimeWindow, {
    message: "Appointment end time must be after start time.",
    path: ["endsAt"],
  });

export const appointmentListQuerySchema = catalogListQueryBaseSchema
  .extend({
    status: appointmentStatusSchema.optional(),
    source: appointmentSourceSchema.optional(),
    clientId: catalogIdSchema.optional(),
    practitionerId: catalogIdSchema.optional(),
    serviceId: catalogIdSchema.optional(),
    from: catalogTimestampSchema.optional(),
    until: catalogTimestampSchema.optional(),
  })
  .strict()
  .refine(
    ({ from, until }) => !from || !until || Date.parse(until) > Date.parse(from),
    {
      message: "Appointment list end time must be after start time.",
      path: ["until"],
    },
  );

export const appointmentListResultSchema = catalogListResultMetaSchema
  .extend({
    items: z.array(appointmentSchema),
  })
  .strict();

export const createAppointmentInputSchema = z
  .object({
    clientId: catalogIdSchema,
    practitionerId: catalogIdSchema,
    serviceId: catalogIdSchema,
    startsAt: catalogTimestampSchema,
    endsAt: catalogTimestampSchema,
    durationMinutes: durationMinutesSchema,
    source: appointmentSourceSchema.default("admin"),
    notesSummary: operationalNotesSummarySchema.optional(),
  })
  .strict()
  .refine(hasValidTimeWindow, {
    message: "Appointment end time must be after start time.",
    path: ["endsAt"],
  });

export const createScheduledAppointmentInputSchema = z
  .object({
    clientId: catalogIdSchema,
    practitionerId: catalogIdSchema,
    serviceId: catalogIdSchema,
    startsAt: catalogTimestampSchema,
    source: appointmentSourceSchema.default("admin"),
    notesSummary: operationalNotesSummarySchema.optional(),
  })
  .strict();

export const rescheduleAppointmentInputSchema = z
  .object({
    id: catalogIdSchema,
    startsAt: catalogTimestampSchema,
    reason: rescheduleReasonSchema,
  })
  .strict();

export const cancelAppointmentInputSchema = z
  .object({
    id: catalogIdSchema,
    reason: cancellationReasonSchema,
  })
  .strict();

export const completeAppointmentInputSchema = z
  .object({
    id: catalogIdSchema,
  })
  .strict();

export const markNoShowAppointmentInputSchema = z
  .object({
    id: catalogIdSchema,
    reason: noShowReasonSchema.optional(),
  })
  .strict();

export const updateAppointmentStatusInputSchema = z
  .object({
    id: catalogIdSchema,
    status: appointmentStatusSchema,
    reason: operationalReasonSchema.optional(),
  })
  .strict();
