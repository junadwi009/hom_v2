import "server-only";

import {
  createMockKnowledgeRepository,
  type KnowledgeRepository,
} from "@hom/domain/knowledge";

import { getDataMode } from "@/lib/env/app-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { createSupabaseKnowledgeRepository } from "./supabase/knowledge-repository";
import type { KnowledgeSupabaseClient } from "./supabase/types";

export type KnowledgeRepositories = {
  knowledge: KnowledgeRepository;
};

type CreateKnowledgeRepositoriesOptions = {
  createSupabaseClient?: () => Promise<KnowledgeSupabaseClient>;
};

export async function createKnowledgeRepositories(
  options: CreateKnowledgeRepositoriesOptions = {},
): Promise<KnowledgeRepositories> {
  if (getDataMode() !== "supabase") {
    return { knowledge: createMockKnowledgeRepository() };
  }

  const supabase = options.createSupabaseClient
    ? await options.createSupabaseClient()
    : await createKnowledgeSupabaseClient();

  return { knowledge: createSupabaseKnowledgeRepository(supabase) };
}

async function createKnowledgeSupabaseClient(): Promise<KnowledgeSupabaseClient> {
  return (await createSupabaseServerClient()) as unknown as KnowledgeSupabaseClient;
}
