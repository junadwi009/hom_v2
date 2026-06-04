import {
  applyCatalogPagination,
  includesCatalogSearch,
} from "../catalog/mock-utils";
import {
  appointmentListQuerySchema,
  appointmentListResultSchema,
  appointmentSchema,
} from "./schemas";
import type { AppointmentRepository } from "./repository";
import type { Appointment } from "./types";

export const mockAppointments = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    clientId: "10000000-0000-4000-8000-000000000001",
    clientName: "Mock Client Alpha",
    practitionerId: "20000000-0000-4000-8000-000000000001",
    practitionerName: "Mock Practitioner One",
    serviceId: "30000000-0000-4000-8000-000000000001",
    serviceName: "Mock Intro Assessment",
    status: "scheduled",
    startsAt: "2026-06-01T03:00:00.000Z",
    endsAt: "2026-06-01T04:00:00.000Z",
    durationMinutes: 60,
    source: "admin",
    notesSummary: "Mock first visit orientation.",
    createdAt: "2026-05-28T01:00:00.000Z",
    updatedAt: "2026-05-28T01:00:00.000Z",
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    clientId: "10000000-0000-4000-8000-000000000002",
    clientName: "Mock Client Beta",
    practitionerId: "20000000-0000-4000-8000-000000000002",
    practitionerName: "Mock Practitioner Two",
    serviceId: "30000000-0000-4000-8000-000000000002",
    serviceName: "Mock Private Session",
    status: "confirmed",
    startsAt: "2026-06-01T05:00:00.000Z",
    endsAt: "2026-06-01T05:50:00.000Z",
    durationMinutes: 50,
    source: "admin",
    createdAt: "2026-05-28T01:05:00.000Z",
    updatedAt: "2026-05-28T01:05:00.000Z",
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    clientId: "10000000-0000-4000-8000-000000000001",
    clientName: "Mock Client Alpha",
    practitionerId: "20000000-0000-4000-8000-000000000001",
    practitionerName: "Mock Practitioner One",
    serviceId: "30000000-0000-4000-8000-000000000002",
    serviceName: "Mock Private Session",
    status: "completed",
    startsAt: "2026-05-31T03:00:00.000Z",
    endsAt: "2026-05-31T03:50:00.000Z",
    durationMinutes: 50,
    source: "import",
    createdAt: "2026-05-28T01:10:00.000Z",
    updatedAt: "2026-05-31T04:00:00.000Z",
  },
  {
    id: "40000000-0000-4000-8000-000000000004",
    clientId: "10000000-0000-4000-8000-000000000001",
    clientName: "Mock Client Alpha",
    practitionerId: "20000000-0000-4000-8000-000000000002",
    practitionerName: "Mock Practitioner Two",
    serviceId: "30000000-0000-4000-8000-000000000001",
    serviceName: "Mock Intro Assessment",
    status: "cancelled",
    startsAt: "2026-06-02T03:00:00.000Z",
    endsAt: "2026-06-02T04:00:00.000Z",
    durationMinutes: 60,
    source: "admin",
    notesSummary: "Mock cancelled orientation booking.",
    createdAt: "2026-05-28T01:15:00.000Z",
    updatedAt: "2026-05-30T01:15:00.000Z",
  },
  {
    id: "40000000-0000-4000-8000-000000000005",
    clientId: "10000000-0000-4000-8000-000000000002",
    clientName: "Mock Client Beta",
    practitionerId: "20000000-0000-4000-8000-000000000001",
    practitionerName: "Mock Practitioner One",
    serviceId: "30000000-0000-4000-8000-000000000002",
    serviceName: "Mock Private Session",
    status: "no_show",
    startsAt: "2026-05-30T05:00:00.000Z",
    endsAt: "2026-05-30T05:50:00.000Z",
    durationMinutes: 50,
    source: "import",
    createdAt: "2026-05-28T01:20:00.000Z",
    updatedAt: "2026-05-30T06:00:00.000Z",
  },
] as const satisfies readonly Appointment[];

export function createMockAppointmentRepository(
  seed: readonly Appointment[] = mockAppointments,
): AppointmentRepository {
  const appointments = seed.map((appointment) =>
    appointmentSchema.parse(appointment),
  );

  return {
    async list(query = {}) {
      const parsedQuery = appointmentListQuerySchema.parse(query);
      const filtered = appointments.filter(
        (appointment) =>
          (!parsedQuery.status || appointment.status === parsedQuery.status) &&
          (!parsedQuery.source || appointment.source === parsedQuery.source) &&
          (!parsedQuery.clientId ||
            appointment.clientId === parsedQuery.clientId) &&
          (!parsedQuery.practitionerId ||
            appointment.practitionerId === parsedQuery.practitionerId) &&
          (!parsedQuery.serviceId ||
            appointment.serviceId === parsedQuery.serviceId) &&
          (!parsedQuery.from ||
            Date.parse(appointment.startsAt) >= Date.parse(parsedQuery.from)) &&
          (!parsedQuery.until ||
            Date.parse(appointment.startsAt) < Date.parse(parsedQuery.until)) &&
          includesCatalogSearch(
            [
              appointment.clientName,
              appointment.practitionerName,
              appointment.serviceName,
            ],
            parsedQuery.search,
          ),
      );

      return appointmentListResultSchema.parse({
        items: applyCatalogPagination(filtered, parsedQuery),
        total: filtered.length,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
    },
    async getById(id) {
      return appointments.find((appointment) => appointment.id === id) ?? null;
    },
  };
}
