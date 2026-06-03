import { StatusBadge } from "@/components/hom/status-badge";

import type { PackageTableRow } from "./packages-page-state";

export function PackagesTable({ rows }: { rows: PackageTableRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-foreground-muted">
            <tr>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Package
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Type
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Sessions
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Validity
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Price
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Status
              </th>
              <th
                className="border-b px-4 py-3 text-right font-semibold"
                scope="col"
              >
                Updated
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
                <td className="px-4 py-3 text-foreground">{row.packageType}</td>
                <td className="px-4 py-3 text-foreground">
                  {row.totalSessions}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.validityDays}
                </td>
                <td className="px-4 py-3 text-foreground">{row.priceIdr}</td>
                <td className="px-4 py-3 text-foreground">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-right text-foreground-muted">
                  {row.updated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
