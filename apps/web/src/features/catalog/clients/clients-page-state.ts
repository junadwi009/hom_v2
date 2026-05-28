import type { Client } from "@hom/domain/clients";

export type CatalogDataSource = "mock" | "supabase";

export type ClientTableRow = {
  id: string;
  name: string;
  status: Client["status"];
  primaryPractitioner: string;
  updated: string;
};

export type ClientsPageState =
  | {
      status: "ready";
      source: CatalogDataSource;
      rows: ClientTableRow[];
      total: number;
      pageSize: number;
    }
  | {
      status: "empty";
      source: CatalogDataSource;
    }
  | {
      status: "permission_denied";
      source: "supabase";
    }
  | {
      status: "configuration_error";
      source: "supabase";
    }
  | {
      status: "error";
      source: CatalogDataSource;
    };

export function toClientTableRow(client: Client): ClientTableRow {
  return {
    id: client.id,
    name: client.fullName,
    status: client.status,
    primaryPractitioner: client.primaryPractitionerName ?? "Unassigned",
    updated: toDateLabel(client.updatedAt),
  };
}

function toDateLabel(timestamp: string) {
  const time = Date.parse(timestamp);

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  return new Date(time).toISOString().slice(0, 10);
}
