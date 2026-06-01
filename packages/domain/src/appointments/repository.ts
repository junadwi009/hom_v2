import type {
  Appointment,
  AppointmentListQuery,
  AppointmentListResult,
} from "./types";

export type AppointmentRepository = {
  list(query?: Partial<AppointmentListQuery>): Promise<AppointmentListResult>;
  getById(id: string): Promise<Appointment | null>;
};
