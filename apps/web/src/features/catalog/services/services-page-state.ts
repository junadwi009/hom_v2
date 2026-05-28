import type { Service } from "@hom/domain/services";

export type CatalogDataSource = "mock" | "supabase";

export type ServiceTableRow = {
  id: string;
  name: string;
  category: string;
  duration: string;
  defaultPriceIdr: string;
  status: Service["status"];
  updated: string;
};

export type ServicesPageState =
  | {
      status: "ready";
      source: CatalogDataSource;
      rows: ServiceTableRow[];
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

export function toServiceTableRow(service: Service): ServiceTableRow {
  return {
    id: service.id,
    name: service.name,
    category: service.category,
    duration: `${service.defaultDurationMinutes} min`,
    defaultPriceIdr: formatDefaultPriceIdr(service.defaultPriceIdr),
    status: service.status,
    updated: toDateLabel(service.updatedAt),
  };
}

export function formatDefaultPriceIdr(value: number | null) {
  if (value === null) {
    return "Not set";
  }

  return `Rp ${value.toLocaleString("id-ID")}`;
}

function toDateLabel(timestamp: string) {
  const time = Date.parse(timestamp);

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  return new Date(time).toISOString().slice(0, 10);
}
