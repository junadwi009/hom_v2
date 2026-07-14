import { deriveClientPackageStatus, type ClientPackage } from "@hom/domain/packages";

export type ClientPackageDataSource = "mock" | "supabase";

export type ClientPackageTableRow = {
  id: string;
  clientName: string;
  packageName: string;
  purchasedAt: string;
  expiresAt: string;
  totalSessions: string;
  remainingSessions: string;
  status: ClientPackage["status"];
  updated: string;
};

export type ClientPackagesPageState =
  | {
      status: "ready";
      source: ClientPackageDataSource;
      rows: ClientPackageTableRow[];
      total: number;
      pageSize: number;
    }
  | {
      status: "empty";
      source: ClientPackageDataSource;
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
      source: ClientPackageDataSource;
    };

export function toClientPackageTableRow(
  clientPackage: ClientPackage,
): ClientPackageTableRow {
  return {
    id: clientPackage.id,
    clientName: clientPackage.clientName,
    packageName: clientPackage.packageName,
    purchasedAt: toDateLabel(clientPackage.purchasedAt),
    expiresAt: toDateLabel(clientPackage.expiresAt),
    totalSessions: String(clientPackage.totalSessions),
    remainingSessions: formatRemainingSessions(
      clientPackage.remainingSessions,
      clientPackage.totalSessions,
    ),
    // Present the honest effective status: an `active` package past its
    // `expiresAt` reads as `expired` (the stored column is never flipped).
    status: deriveClientPackageStatus(
      clientPackage.status,
      clientPackage.expiresAt,
    ),
    updated: toDateLabel(clientPackage.updatedAt),
  };
}

export function formatRemainingSessions(
  remainingSessions: number,
  totalSessions: number,
) {
  return `${remainingSessions} / ${totalSessions}`;
}

function toDateLabel(timestamp: string) {
  const time = Date.parse(timestamp);

  if (Number.isNaN(time)) {
    return "Unknown";
  }

  return new Date(time).toISOString().slice(0, 10);
}
