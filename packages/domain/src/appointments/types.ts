import type { z } from "zod";

import type {
  appointmentListQuerySchema,
  appointmentListResultSchema,
  appointmentSchema,
  appointmentSourceSchema,
  appointmentStatusSchema,
  cancelAppointmentInputSchema,
  completeAppointmentInputSchema,
  createAppointmentInputSchema,
  createScheduledAppointmentInputSchema,
  markNoShowAppointmentInputSchema,
  rescheduleAppointmentInputSchema,
  updateAppointmentStatusInputSchema,
} from "./schemas";

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type AppointmentSource = z.infer<typeof appointmentSourceSchema>;
export type Appointment = z.infer<typeof appointmentSchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
export type AppointmentListResult = z.infer<
  typeof appointmentListResultSchema
>;
export type CreateAppointmentInput = z.infer<
  typeof createAppointmentInputSchema
>;
export type CreateScheduledAppointmentInput = z.infer<
  typeof createScheduledAppointmentInputSchema
>;
export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentInputSchema
>;
export type CancelAppointmentInput = z.infer<
  typeof cancelAppointmentInputSchema
>;
export type CompleteAppointmentInput = z.infer<
  typeof completeAppointmentInputSchema
>;
export type MarkNoShowAppointmentInput = z.infer<
  typeof markNoShowAppointmentInputSchema
>;
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusInputSchema
>;
