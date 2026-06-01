import {
  appointmentListQuerySchema,
  appointmentListResultSchema,
  type AppointmentRepository,
} from "@hom/domain/appointments";

import { AppointmentRepositoryError } from "@/lib/appointments/errors";

import { mapAppointmentRow } from "./appointment-row-mapper";
import type { AppointmentSupabaseClient } from "./types";

const APPOINTMENT_SELECT = [
  "id",
  "client_id",
  "practitioner_id",
  "service_id",
  "status",
  "starts_at",
  "ends_at",
  "duration_minutes",
  "source",
  "notes_summary",
  "created_at",
  "updated_at",
  "clients(full_name)",
  "practitioners(display_name)",
  "services(name)",
].join(",");

export function createSupabaseAppointmentRepository(
  supabase: AppointmentSupabaseClient,
): AppointmentRepository {
  return {
    async list(query = {}) {
      const parsedQuery = appointmentListQuerySchema.parse(query);

      if (parsedQuery.search) {
        throw new AppointmentRepositoryError({
          operation: "appointments.list",
          table: "appointments",
          code: "UNSUPPORTED_SEARCH",
        });
      }

      const from = (parsedQuery.page - 1) * parsedQuery.pageSize;
      const to = from + parsedQuery.pageSize - 1;
      let request = supabase
        .from("appointments")
        .select(APPOINTMENT_SELECT, { count: "exact" });

      if (parsedQuery.status) {
        request = request.eq("status", parsedQuery.status);
      }

      if (parsedQuery.source) {
        request = request.eq("source", parsedQuery.source);
      }

      if (parsedQuery.clientId) {
        request = request.eq("client_id", parsedQuery.clientId);
      }

      if (parsedQuery.practitionerId) {
        request = request.eq("practitioner_id", parsedQuery.practitionerId);
      }

      if (parsedQuery.serviceId) {
        request = request.eq("service_id", parsedQuery.serviceId);
      }

      if (parsedQuery.from) {
        request = request.gte("starts_at", parsedQuery.from);
      }

      if (parsedQuery.until) {
        request = request.lt("starts_at", parsedQuery.until);
      }

      const response = await request
        .order("starts_at", { ascending: true })
        .range(from, to);

      if (response.error) {
        throw AppointmentRepositoryError.fromSupabase(
          "appointments.list",
          "appointments",
          response.error,
        );
      }

      const rows = response.data ?? [];

      return appointmentListResultSchema.parse({
        items: rows.map(mapAppointmentRow),
        total: response.count ?? rows.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },

    async getById(id) {
      const response = await supabase
        .from("appointments")
        .select(APPOINTMENT_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (response.error) {
        throw AppointmentRepositoryError.fromSupabase(
          "appointments.getById",
          "appointments",
          response.error,
        );
      }

      return response.data ? mapAppointmentRow(response.data) : null;
    },
  };
}
