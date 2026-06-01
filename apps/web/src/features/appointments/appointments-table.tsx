import { StatusBadge } from "@/components/hom/status-badge";

import type { AppointmentTableRow } from "./appointments-page-state";

export function AppointmentsTable({ rows }: { rows: AppointmentTableRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-foreground-muted">
            <tr>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Schedule
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Client
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Practitioner
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Service
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Duration
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Status
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Source
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
                  {row.scheduled}
                </td>
                <td className="px-4 py-3 text-foreground">{row.clientName}</td>
                <td className="px-4 py-3 text-foreground">
                  {row.practitionerName}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.serviceName}
                </td>
                <td className="px-4 py-3 text-foreground">{row.duration}</td>
                <td className="px-4 py-3 text-foreground">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-foreground">{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
