import type { Package } from "@hom/domain/packages";

export type PackageDataSource = "mock" | "supabase";

export type PackageTableRow = {
  id: string;
  name: string;
  packageType: string;
  totalSessions: string;
  validityDays: string;
  priceIdr: string;
  status: Package["status"];
  updated: string;
};

export type PackagesPageState =
  | {
      status: "ready";
      source: PackageDataSource;
      rows: PackageTableRow[];
      total: number;
      pageSize: number;
    }
  | {
      status: "empty";
      source: PackageDataSource;
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
      source: PackageDataSource;
    };

export function toPackageTableRow(packageItem: Package): PackageTableRow {
  return {
    id: packageItem.id,
    name: packageItem.name,
    packageType: formatPackageType(packageItem.packageType),
    totalSessions: String(packageItem.totalSessions),
    validityDays: `${packageItem.validityDays} days`,
    priceIdr: formatPriceIdr(packageItem.priceIdr),
    status: packageItem.status,
    updated: toDateLabel(packageItem.updatedAt),
  };
}

export function formatPriceIdr(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatPackageType(value: Package["packageType"]) {
  return value.replaceAll("_", " ");
}

function toDateLabel(timestamp: string) {
  const time = Date.parse(timestamp);

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  return new Date(time).toISOString().slice(0, 10);
}
