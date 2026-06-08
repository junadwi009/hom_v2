"use client";

import { Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import type { PaymentTableRow } from "./payments-page-state";

const CSV_HEADER = [
  "Client",
  "Package",
  "Amount",
  "Method",
  "Status",
  "Paid Date",
  "Reference",
  "Updated",
];

function toCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

// Client-side CSV export of the visible payment records. No RPC, no mutation —
// read-only operational reference. Also honours the `?export=1` topbar deep
// link (fires once, then cleans the URL so a reload won't re-download).
export function PaymentsExportButton({ rows }: { rows: PaymentTableRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantExport = searchParams.get("export") === "1";
  const handledRef = useRef(false);

  const exportCsv = useCallback(() => {
    const body = rows.map((row) => [
      row.clientName,
      row.packageName,
      row.amountIdr,
      row.paymentMethod,
      row.status,
      row.paidAt,
      row.referenceNumber,
      row.updated,
    ]);
    const csv = [CSV_HEADER, ...body]
      .map((line) => line.map((cell) => toCsvCell(String(cell))).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  useEffect(() => {
    if (wantExport && !handledRef.current) {
      handledRef.current = true;
      exportCsv();
      router.replace("/payments");
    } else if (!wantExport) {
      handledRef.current = false;
    }
  }, [wantExport, exportCsv, router]);

  return (
    <Button onClick={exportCsv} size="sm" type="button" variant="secondary">
      <Download aria-hidden="true" className="size-4" />
      Export
    </Button>
  );
}
