import "server-only";

import type { Client } from "@hom/domain/clients";

import { createCatalogRepositories } from "@/lib/catalog/repository-factory";

import type { ClientStatus, ManagedClient } from "./management-data";

const statusMap: Record<Client["status"], ClientStatus> = {
  active: "Active",
  prospect: "Trial",
  inactive: "Dormant",
  archived: "Dormant",
};

// Loads real clients from Supabase and maps them to the light ManagedClient
// shape used by the list. Rich detail (membership/activity/spend) loads on
// demand via the detail panel (see client-detail-loader.ts). Newly created
// clients appear here after revalidation, proving the create pipeline persists.
export async function loadRealManagedClients(): Promise<ManagedClient[]> {
  try {
    const repositories = await createCatalogRepositories();
    const result = await repositories.clients.list({ pageSize: 12 });
    return result.items.map(mapClientToManaged);
  } catch {
    return [];
  }
}

function mapClientToManaged(client: Client): ManagedClient {
  return {
    id: client.id,
    name: client.fullName,
    phone: client.maskedPhone ?? "—",
    initials: toInitials(client.fullName),
    status: statusMap[client.status],
  };
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}
