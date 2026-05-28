import type { ReactNode } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/hom/status-badge";
import { cn } from "@/lib/utils";

export type DataTableProps = {
  columns: string[];
  rows: Array<Record<string, ReactNode>>;
  emptyTitle?: string;
};

function renderCell(value: ReactNode) {
  if (typeof value === "string") {
    const statusLike = [
      "confirmed",
      "scheduled",
      "reschedule_requested",
      "done",
      "pending",
      "published",
      "tested",
      "review_required",
      "placeholder",
      "blocked",
      "deferred",
    ];

    if (statusLike.includes(value)) {
      return <StatusBadge status={value} />;
    }
  }

  return value;
}

export function DataTable({ columns, rows, emptyTitle = "No rows available" }: DataTableProps) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description="Try a different filter or create a new record later." />;
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-foreground-muted">
            <tr>
              {columns.map((column, index) => (
                <th
                  className={cn("border-b px-4 py-3 font-semibold", index === columns.length - 1 && "text-right")}
                  key={column}
                  scope="col"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr className="border-b last:border-b-0 hover:bg-stone-50/70" key={`${rowIndex}-${columns[0]}`}>
                {columns.map((column, columnIndex) => (
                  <td
                    className={cn("px-4 py-3 text-foreground", columnIndex === columns.length - 1 && "text-right")}
                    key={column}
                  >
                    {renderCell(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
