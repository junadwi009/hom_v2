"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { AuditLogView } from "./audit-logs-loader";

const riskTone: Record<
  AuditLogView["riskLevel"],
  "neutral" | "warning" | "danger"
> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

const avatarPalette = [
  "bg-amber-100 text-amber-800",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

function paletteFor(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return avatarPalette[sum % avatarPalette.length];
}

export function actionTone(
  action: string,
): "success" | "info" | "warning" | "danger" | "neutral" {
  const verb = action.split(".").pop() ?? "";
  if (verb.includes("created")) return "success";
  if (verb.includes("deleted") || verb.includes("removed")) return "danger";
  if (verb.includes("failed")) return "danger";
  if (verb.includes("changed") || verb.includes("updated")) return "warning";
  if (verb.includes("login") || verb.includes("viewed")) return "info";
  return "neutral";
}

export function formatTimestamp(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Date(time).toISOString().slice(0, 16).replace("T", " ");
}

export function AuditLogTable({
  logs,
  selectedId,
  onSelect,
}: {
  logs: AuditLogView[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase text-foreground-muted">
          <tr>
            <th className="border-b px-3 py-2 font-semibold">Waktu</th>
            <th className="border-b px-3 py-2 font-semibold">User</th>
            <th className="border-b px-3 py-2 font-semibold">Aktivitas</th>
            <th className="border-b px-3 py-2 font-semibold">Modul</th>
            <th className="border-b px-3 py-2 font-semibold">Risk</th>
            <th className="border-b px-3 py-2 font-semibold">IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              className={cn(
                "cursor-pointer border-b last:border-b-0 hover:bg-stone-50/70",
                log.id === selectedId && "bg-accent-gold-muted/40",
              )}
              key={log.id}
              onClick={() => onSelect(log.id)}
            >
              <td className="whitespace-nowrap px-3 py-3 text-foreground-muted">
                {formatTimestamp(log.timestamp)}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      paletteFor(log.actorName),
                    )}
                  >
                    {initials(log.actorName)}
                  </span>
                  <span className="font-medium text-foreground">
                    {log.actorName}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3">
                <Badge tone={actionTone(log.action)}>{log.action}</Badge>
              </td>
              <td className="px-3 py-3 text-foreground-muted">{log.module}</td>
              <td className="px-3 py-3">
                <Badge tone={riskTone[log.riskLevel]}>{log.riskLevel}</Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-foreground-muted">
                {log.ipAddress ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
