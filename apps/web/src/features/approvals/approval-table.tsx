"use client";

import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCompactIDR, formatDurationID } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  DOMAIN_LABELS,
  getApprovalStatusBadgeTone,
  getApprovalStatusLabel,
  getRiskBadgeTone,
  getRiskLabel,
} from "./approval-helpers";
import type { ApprovalRequest } from "./approval-types";

export function ApprovalTable({
  requests,
  selectedId,
  onSelect,
}: {
  requests: ApprovalRequest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (requests.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-foreground-muted">
        Tidak ada request yang cocok dengan filter.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase text-foreground-muted">
          <tr>
            <th className="border-b px-3 py-2 font-semibold">Request</th>
            <th className="border-b px-3 py-2 font-semibold">Requester</th>
            <th className="border-b px-3 py-2 font-semibold">Impact</th>
            <th className="border-b px-3 py-2 font-semibold">Risk</th>
            <th className="border-b px-3 py-2 font-semibold">Status</th>
            <th className="border-b px-3 py-2 font-semibold">Menunggu</th>
            <th className="border-b px-3 py-2 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const active = req.id === selectedId;
            return (
              <tr
                className={cn(
                  "cursor-pointer border-b last:border-b-0 hover:bg-stone-50/70",
                  active && "bg-accent-gold-muted/40",
                )}
                key={req.id}
                onClick={() => onSelect(req.id)}
              >
                <td className="px-3 py-3">
                  <p className="font-medium text-foreground">{req.title}</p>
                  <p className="text-xs text-foreground-muted">
                    {DOMAIN_LABELS[req.domain]} · {req.branch}
                    {req.sensitive ? (
                      <span className="ml-1.5 font-medium text-rose-600">· Sensitif</span>
                    ) : null}
                  </p>
                </td>
                <td className="px-3 py-3 text-foreground-muted">
                  <span className="text-foreground">{req.requestedBy.name}</span>
                  <span className="block text-xs">{req.requestedBy.role}</span>
                </td>
                <td className="px-3 py-3">
                  {req.amountIdr ? (
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCompactIDR(req.amountIdr)}
                    </span>
                  ) : (
                    <span className="text-xs text-foreground-muted">{req.impactLabel}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Badge tone={getRiskBadgeTone(req.risk)}>{getRiskLabel(req.risk)}</Badge>
                </td>
                <td className="px-3 py-3">
                  <Badge tone={getApprovalStatusBadgeTone(req.status)}>
                    {getApprovalStatusLabel(req.status)}
                  </Badge>
                </td>
                <td
                  className={cn(
                    "px-3 py-3 whitespace-nowrap text-foreground-muted",
                    req.waitingHours > 24 && "font-medium text-red-600",
                  )}
                >
                  {formatDurationID(req.waitingHours)}
                </td>
                <td className="px-3 py-3 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium",
                      active
                        ? "border-accent-gold bg-accent-gold-muted/60 text-amber-900"
                        : "text-foreground-muted",
                    )}
                  >
                    Detail
                    <ChevronRight aria-hidden="true" className="size-3.5" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
