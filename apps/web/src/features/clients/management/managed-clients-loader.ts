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

// Loads real clients from Supabase and maps them to the rich ManagedClient shape
// with neutral defaults (activity/health are not modeled yet). Newly created
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
    membershipName: "—",
    membershipDetail: "Belum ada paket",
    lastVisit: "—",
    nextBooking: null,
    riskLevel: "Low",
    totalSpend: "Rp 0",
    healthScore: 70,
    riskReasons: ["Data aktivitas belum tersedia"],
    membership: {
      name: "—",
      startLabel: "—",
      expiryLabel: "Belum ada membership",
      used: 0,
      total: 1,
      unit: "sesi",
      active: false,
    },
    activity: {
      lastVisit: "—",
      lastClass: "—",
      totalVisit: "0 kali",
    },
    spend: {
      total: "Rp 0",
      perMonth: "—",
      lastPayment: "—",
    },
    aiRecommendation:
      "Lengkapi profil & aktivitas client untuk mendapatkan insight personal.",
  };
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}
