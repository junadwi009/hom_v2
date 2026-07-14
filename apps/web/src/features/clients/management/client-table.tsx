"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { ClientStatus, ManagedClient } from "./management-data";

const statusTone: Record<ClientStatus, "success" | "danger" | "info" | "warning" | "neutral"> = {
  Active: "success",
  Trial: "info",
  Dormant: "neutral",
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

