"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type {
  ClientStatus,
  ManagedClient,
  RiskLevel,
} from "./management-data";

const statusTone: Record<ClientStatus, "success" | "danger" | "info" | "warning" | "neutral"> = {
  Active: "success",
  "At-Risk": "danger",
  Trial: "info",
  "Expiring Soon": "warning",
  Dormant: "neutral",
};

const riskTone: Record<RiskLevel, "danger" | "warning" | "success"> = {
  High: "danger",
  Medium: "warning",
  Low: "success",
};

export function ClientTable({
  clients,
  selectedId,
  onSelect,
}: {
  clients: ManagedClient[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase text-foreground-muted">
          <tr>
            <th className="border-b px-3 py-2 font-semibold">Client</th>
            <th className="border-b px-3 py-2 font-semibold">Status</th>
            <th className="border-b px-3 py-2 font-semibold">Membership / Package</th>
            <th className="border-b px-3 py-2 font-semibold">Last Visit</th>
            <th className="border-b px-3 py-2 font-semibold">Next Booking</th>
            <th className="border-b px-3 py-2 font-semibold">Risk</th>
            <th className="border-b px-3 py-2 font-semibold">Total Spend</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              className={cn(
                "cursor-pointer border-b last:border-b-0 hover:bg-stone-50/70",
                client.id === selectedId && "bg-accent-gold-muted/40",
              )}
              key={client.id}
              onClick={() => onSelect(client.id)}
            >
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-gold-muted text-xs font-semibold text-amber-900">
                    {client.initials}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 font-medium text-foreground">
                      {client.name}
                      {client.vip ? <Badge tone="warning">VIP</Badge> : null}
                    </p>
                    <p className="text-xs text-foreground-muted">{client.phone}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3">
                <Badge tone={statusTone[client.status]}>{client.status}</Badge>
              </td>
              <td className="px-3 py-3">
                <p className="text-foreground">{client.membershipName}</p>
                <p className="text-xs text-foreground-muted">{client.membershipDetail}</p>
              </td>
              <td className="px-3 py-3 text-foreground-muted">{client.lastVisit}</td>
              <td className="px-3 py-3 text-foreground-muted">
                {client.nextBooking ?? "—"}
              </td>
              <td className="px-3 py-3">
                <Badge tone={riskTone[client.riskLevel]}>{client.riskLevel}</Badge>
              </td>
              <td className="px-3 py-3 font-medium text-foreground">
                {client.totalSpend}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

