import "server-only";

import type { Client, ClientRepository } from "@hom/domain/clients";

import { createCatalogRepositories } from "@/lib/catalog/repository-factory";

import type { ClientDetail, ClientDetailState } from "./client-detail-types";

type LoadClientDetailOptions = {
  repository?: ClientRepository;
};

/**
 * Fetches a single client on demand for the detail panel. Contact data is returned
 * MASKED (the supabase row mapper masks phone/email); it is never present in the
 * bulk client list. RLS still governs whether the row is visible at all.
 */
export async function loadClientDetail(
  clientId: string,
  options: LoadClientDetailOptions = {},
): Promise<ClientDetailState> {
  try {
    const repository =
      options.repository ?? (await createCatalogRepositories()).clients;
    const client = await repository.getById(clientId);

    if (!client) {
      return { status: "not_found" };
    }

    return { status: "ready", detail: toClientDetail(client) };
  } catch {
    return { status: "unavailable" };
  }
}

function toClientDetail(client: Client): ClientDetail {
  return {
    id: client.id,
    name: client.fullName,
    status: client.status,
    primaryPractitioner: client.primaryPractitionerName ?? "Belum ada",
    maskedPhone: client.maskedPhone,
    maskedEmail: client.maskedEmail,
    created: toDateLabel(client.createdAt),
    updated: toDateLabel(client.updatedAt),
  };
}

function toDateLabel(timestamp: string): string {
  const time = Date.parse(timestamp);
  if (Number.isNaN(time)) {
    return "Unknown";
  }
  return new Date(time).toISOString().slice(0, 10);
}
