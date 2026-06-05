import { StatusBadge } from "@/components/hom/status-badge";

import { ClientDetailSheet } from "./client-detail-sheet";
import type { ClientDetailAction } from "./client-detail-types";
import type { ClientTableRow } from "./clients-page-state";

export function ClientsTable({
  rows,
  detailAction,
}: {
  rows: ClientTableRow[];
  detailAction?: ClientDetailAction;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-foreground-muted">
            <tr>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Client
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Status
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Primary Practitioner
              </th>
              <th
                className="border-b px-4 py-3 text-right font-semibold"
                scope="col"
              >
                Updated
              </th>
              <th
                className="border-b px-4 py-3 text-right font-semibold"
                scope="col"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className="border-b last:border-b-0 hover:bg-stone-50/70"
                key={row.id}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-foreground">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.primaryPractitioner}
                </td>
                <td className="px-4 py-3 text-right text-foreground-muted">
                  {row.updated}
                </td>
                <td className="px-4 py-3 text-right">
                  <ClientDetailSheet
                    action={detailAction}
                    client={{
                      id: row.id,
                      name: row.name,
                      status: row.status,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
