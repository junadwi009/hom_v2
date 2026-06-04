import { StatusBadge } from "@/components/hom/status-badge";

import { PaymentTransitionDialog } from "./payment-transition-dialog";
import type { PaymentTransitionFormAction } from "./payment-transition-types";
import type { PaymentTableRow } from "./payments-page-state";

export function PaymentsTable({
  cancelAction,
  canManagePayment,
  dataMode,
  markPaidAction,
  rows,
}: {
  cancelAction?: PaymentTransitionFormAction;
  canManagePayment?: boolean;
  dataMode?: "mock" | "supabase";
  markPaidAction?: PaymentTransitionFormAction;
  rows: PaymentTableRow[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-foreground-muted">
            <tr>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Client
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Package
              </th>
              <th
                className="border-b px-4 py-3 text-right font-semibold"
                scope="col"
              >
                Amount
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Method
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Status
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Paid Date
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
                Reference
              </th>
              <th
                className="border-b px-4 py-3 text-right font-semibold"
                scope="col"
              >
                Updated
              </th>
              <th className="border-b px-4 py-3 font-semibold" scope="col">
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
                  {row.clientName}
                </td>
                <td className="px-4 py-3 text-foreground">{row.packageName}</td>
                <td className="px-4 py-3 text-right text-foreground">
                  {row.amountIdr}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.paymentMethod}
                </td>
                <td className="px-4 py-3 text-foreground">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-foreground">{row.paidAt}</td>
                <td className="px-4 py-3 text-foreground-muted">
                  {row.referenceNumber}
                </td>
                <td className="px-4 py-3 text-right text-foreground-muted">
                  {row.updated}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.status === "pending" ? (
                    <span className="flex flex-wrap gap-2">
                      <PaymentTransitionDialog
                        action={markPaidAction}
                        canManagePayment={canManagePayment}
                        dataMode={dataMode ?? "mock"}
                        kind="mark_paid"
                        paymentId={row.id}
                        paymentLabel={`${row.clientName} · ${row.amountIdr}`}
                      />
                      <PaymentTransitionDialog
                        action={cancelAction}
                        canManagePayment={canManagePayment}
                        dataMode={dataMode ?? "mock"}
                        kind="cancel"
                        paymentId={row.id}
                        paymentLabel={`${row.clientName} · ${row.amountIdr}`}
                      />
                    </span>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
