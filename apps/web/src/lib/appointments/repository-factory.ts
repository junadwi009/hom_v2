import {
  createMockAppointmentRepository,
  type AppointmentRepository,
} from "@hom/domain/appointments";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createSupabaseAppointmentRepository } from "./supabase/appointment-repository";
import type { AppointmentSupabaseClient } from "./supabase/types";

type CreateAppointmentRepositoryOptions = {
  createSupabaseClient?: () => Promise<AppointmentSupabaseClient>;
};

export async function createAppointmentRepository(
  options: CreateAppointmentRepositoryOptions = {},
): Promise<AppointmentRepository> {
  if (getDataMode() !== "supabase") {
    return createMockAppointmentRepository();
  }

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createAppointmentSupabaseClient();

  return createSupabaseAppointmentRepository(supabase);
}

async function createAppointmentSupabaseClient(): Promise<AppointmentSupabaseClient> {
  return (await createSupabaseServerClient()) as unknown as AppointmentSupabaseClient;
}
