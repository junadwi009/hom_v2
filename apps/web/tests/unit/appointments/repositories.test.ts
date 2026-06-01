import { afterEach, describe, expect, it, vi } from "vitest";

import { AppointmentRepositoryError } from "../../../src/lib/appointments/errors";
import { createAppointmentRepository } from "../../../src/lib/appointments/repository-factory";
import { mapAppointmentRow } from "../../../src/lib/appointments/supabase/appointment-row-mapper";
import { createSupabaseAppointmentRepository } from "../../../src/lib/appointments/supabase/appointment-repository";
import type {
  AppointmentRow,
  AppointmentSupabaseClient,
  AppointmentSupabaseError,
} from "../../../src/lib/appointments/supabase/types";

const appointmentRow: AppointmentRow = {
  id: "40000000-0000-4000-8000-000000000001",
  client_id: "10000000-0000-4000-8000-000000000001",
  practitioner_id: "20000000-0000-4000-8000-000000000001",
  service_id: "30000000-0000-4000-8000-000000000001",
  status: "scheduled",
  starts_at: "2026-06-01 03:00:00+00",
  ends_at: "2026-06-01 04:00:00+00",
  duration_minutes: 60,
  source: "admin",
  notes_summary: "Mock operational orientation.",
  created_at: "2026-05-28 01:00:00+00",
  updated_at: "2026-05-28 01:00:00+00",
  clients: {
    full_name: "Mock Client Alpha",
  },
  practitioners: {
    display_name: "Mock Practitioner One",
  },
  services: {
    name: "Mock Intro Assessment",
  },
};

type QueryCall = {
  select: {
    columns: string;
    options?: { count?: "exact" };
  };
  eq: { column: string; value: string }[];
  gte: { column: string; value: string }[];
  lt: { column: string; value: string }[];
  order?: { column: string; options?: { ascending?: boolean } };
  range?: { from: number; to: number };
  maybeSingle: boolean;
};

function createMockAppointmentSupabaseClient(options?: {
  rows?: AppointmentRow[];
  error?: AppointmentSupabaseError;
}) {
  const rows = options?.rows ?? [];
  const calls: QueryCall[] = [];

  const client = {
    from(table: "appointments") {
      expect(table).toBe("appointments");

      return {
        select(columns: string, selectOptions?: { count?: "exact" }) {
          const call: QueryCall = {
            select: {
              columns,
              options: selectOptions,
            },
            eq: [],
            gte: [],
            lt: [],
            maybeSingle: false,
          };
          calls.push(call);

          const builder = {
            eq(column: string, value: string) {
              call.eq.push({ column, value });
              return builder;
            },
            gte(column: string, value: string) {
              call.gte.push({ column, value });
              return builder;
            },
            lt(column: string, value: string) {
              call.lt.push({ column, value });
              return builder;
            },
            order(column: string, orderOptions?: { ascending?: boolean }) {
              call.order = { column, options: orderOptions };
              return builder;
            },
            async range(from: number, to: number) {
              call.range = { from, to };

              return {
                data: rows,
                error: options?.error ?? null,
                count: rows.length,
              };
            },
            async maybeSingle() {
              call.maybeSingle = true;

              return {
                data: rows[0] ?? null,
                error: options?.error ?? null,
              };
            },
          };

          return builder;
        },
      };
    },
  } as unknown as AppointmentSupabaseClient;

  return { client, calls };
}

describe("appointment Supabase row mapper", () => {
  it("maps approved database fields without exposing sensitive fields", () => {
    const appointment = mapAppointmentRow(appointmentRow);

    expect(appointment).toMatchObject({
      clientId: appointmentRow.client_id,
      clientName: "Mock Client Alpha",
      practitionerId: appointmentRow.practitioner_id,
      practitionerName: "Mock Practitioner One",
      serviceId: appointmentRow.service_id,
      serviceName: "Mock Intro Assessment",
      startsAt: "2026-06-01T03:00:00.000Z",
      endsAt: "2026-06-01T04:00:00.000Z",
      durationMinutes: 60,
      notesSummary: "Mock operational orientation.",
    });
    expect(Object.keys(appointment)).not.toEqual(
      expect.arrayContaining([
        "phone",
        "email",
        "clinicalNotes",
        "paymentData",
        "whatsappMessages",
        "packageData",
      ]),
    );
  });

  it.each(["not_a_status", "draft", "rescheduled"])(
    "rejects unsupported current status %s",
    (status) => {
      expect(() =>
        mapAppointmentRow({
          ...appointmentRow,
          status,
        }),
      ).toThrow();
    },
  );
});

describe("appointment repository factory", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to mock mode when HOM_DATA_MODE is missing or invalid", async () => {
    vi.stubEnv("HOM_DATA_MODE", "invalid_mode");

    let supabaseFactoryCalled = false;
    const { client } = createMockAppointmentSupabaseClient();
    const repository = await createAppointmentRepository({
      createSupabaseClient: async () => {
        supabaseFactoryCalled = true;
        return client;
      },
    });
    const result = await repository.list();

    expect(supabaseFactoryCalled).toBe(false);
    expect(result.items[0]?.clientName).toBe("Mock Client Alpha");
  });

  it("selects the Supabase repository in Supabase mode", async () => {
    vi.stubEnv("HOM_DATA_MODE", "supabase");

    const { client, calls } = createMockAppointmentSupabaseClient({
      rows: [appointmentRow],
    });
    const repository = await createAppointmentRepository({
      createSupabaseClient: async () => client,
    });

    await repository.list();

    expect(calls).toHaveLength(1);
  });
});

describe("Supabase appointment repository", () => {
  it("exposes only list and getById methods", () => {
    const { client } = createMockAppointmentSupabaseClient();
    const repository = createSupabaseAppointmentRepository(client);

    expect(Object.keys(repository).sort()).toEqual(["getById", "list"]);
  });

  it("builds list and getById queries with safe filters and pagination", async () => {
    const { client, calls } = createMockAppointmentSupabaseClient({
      rows: [appointmentRow],
    });
    const repository = createSupabaseAppointmentRepository(client);

    await repository.list({
      status: "scheduled",
      source: "admin",
      clientId: appointmentRow.client_id,
      practitionerId: appointmentRow.practitioner_id,
      serviceId: appointmentRow.service_id,
      from: "2026-06-01T00:00:00.000Z",
      until: "2026-06-02T00:00:00.000Z",
      page: 2,
      pageSize: 10,
    });
    await repository.getById(appointmentRow.id);

    expect(calls[0]).toMatchObject({
      select: {
        options: {
          count: "exact",
        },
      },
      eq: [
        { column: "status", value: "scheduled" },
        { column: "source", value: "admin" },
        { column: "client_id", value: appointmentRow.client_id },
        { column: "practitioner_id", value: appointmentRow.practitioner_id },
        { column: "service_id", value: appointmentRow.service_id },
      ],
      gte: [{ column: "starts_at", value: "2026-06-01T00:00:00.000Z" }],
      lt: [{ column: "starts_at", value: "2026-06-02T00:00:00.000Z" }],
      order: { column: "starts_at", options: { ascending: true } },
      range: { from: 10, to: 19 },
    });
    expect(calls[0]?.select.columns).toContain("clients(full_name)");
    expect(calls[0]?.select.columns).toContain("practitioners(display_name)");
    expect(calls[0]?.select.columns).toContain("services(name)");
    expect(calls[1]).toMatchObject({
      eq: [{ column: "id", value: appointmentRow.id }],
      maybeSingle: true,
    });
  });

  it("rejects relation-wide search instead of returning misleading data", async () => {
    const { client } = createMockAppointmentSupabaseClient();
    const repository = createSupabaseAppointmentRepository(client);

    await expect(repository.list({ search: "Alpha" })).rejects.toMatchObject({
      name: "AppointmentRepositoryError",
      code: "UNSUPPORTED_SEARCH",
    });
  });

  it("converts Supabase failures to safe repository errors", async () => {
    const { client } = createMockAppointmentSupabaseClient({
      error: {
        code: "42501",
        message: "permission denied for table appointments",
        details: "raw database detail",
      },
    });
    const repository = createSupabaseAppointmentRepository(client);

    await expect(repository.list()).rejects.toMatchObject({
      name: "AppointmentRepositoryError",
      message: "Appointment data could not be loaded.",
      operation: "appointments.list",
      table: "appointments",
      code: "42501",
    });

    try {
      await repository.list();
    } catch (error) {
      expect(error).toBeInstanceOf(AppointmentRepositoryError);
      expect((error as Error).message).not.toContain("permission denied");
      expect((error as Error).message).not.toContain("raw database detail");
    }
  });
});
