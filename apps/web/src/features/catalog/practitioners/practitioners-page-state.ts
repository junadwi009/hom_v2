import type { Practitioner } from "@hom/domain/practitioners";

export type CatalogDataSource = "mock" | "supabase";

export type PractitionerTableRow = {
  id: string;
  displayName: string;
  status: Practitioner["status"];
  appProfile: "Linked" | "Not linked";
  updated: string;
};

export type PractitionersPageState =
  | {
      status: "ready";
      source: CatalogDataSource;
      rows: PractitionerTableRow[];
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

export function toPractitionerTableRow(
  practitioner: Practitioner,
): PractitionerTableRow {
  return {
    id: practitioner.id,
    displayName: practitioner.displayName,
    status: practitioner.status,
    appProfile: practitioner.appUserId ? "Linked" : "Not linked",
    updated: toDateLabel(practitioner.updatedAt),
  };
}

function toDateLabel(timestamp: string) {
  const time = Date.parse(timestamp);

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  return new Date(time).toISOString().slice(0, 10);
}
