import {
  createMockClientRepository,
  type ClientRepository,
} from "@hom/domain/clients";
import {
  createMockPractitionerRepository,
  type PractitionerRepository,
} from "@hom/domain/practitioners";
import {
  createMockServiceRepository,
  type ServiceRepository,
} from "@hom/domain/services";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createSupabaseClientRepository } from "./supabase/client-repository";
import { createSupabasePractitionerRepository } from "./supabase/practitioner-repository";
import { createSupabaseServiceRepository } from "./supabase/service-repository";
import type { CatalogSupabaseClient } from "./supabase/types";

export type CatalogRepositories = {
  clients: ClientRepository;
  practitioners: PractitionerRepository;
  services: ServiceRepository;
};

type CreateCatalogRepositoriesOptions = {
  createSupabaseClient?: () => Promise<CatalogSupabaseClient>;
};

export async function createCatalogRepositories(
  options: CreateCatalogRepositoriesOptions = {},
): Promise<CatalogRepositories> {
  if (getDataMode() !== "supabase") {
    return createMockCatalogRepositories();
  }

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createCatalogSupabaseClient();

  return createSupabaseCatalogRepositories(supabase);
}

export function createMockCatalogRepositories(): CatalogRepositories {
  return {
    clients: createMockClientRepository(),
    practitioners: createMockPractitionerRepository(),
    services: createMockServiceRepository(),
  };
}

export function createSupabaseCatalogRepositories(
  supabase: CatalogSupabaseClient,
): CatalogRepositories {
  return {
    clients: createSupabaseClientRepository(supabase),
    practitioners: createSupabasePractitionerRepository(supabase),
    services: createSupabaseServiceRepository(supabase),
  };
}

async function createCatalogSupabaseClient(): Promise<CatalogSupabaseClient> {
  return (await createSupabaseServerClient()) as unknown as CatalogSupabaseClient;
}
