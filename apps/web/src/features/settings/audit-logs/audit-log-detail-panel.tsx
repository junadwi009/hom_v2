"use client";

import { ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { AuditLogView } from "./audit-logs-loader";
import { actionTone, formatTimestamp } from "./audit-log-table";

const riskTone: Record<
  AuditLogView["riskLevel"],
  "neutral" | "warning" | "danger"
> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export function AuditLogDetailPanel({ log }: { log: AuditLogView | null }) {
  if (!log) {
    return (
      <section className="flex h-full flex-col items-center justify-center rounded-lg border bg-background-card p-8 text-center shadow-[var(--shadow-soft)]">
        <ScrollText aria-hidden="true" className="size-8 text-foreground-muted" />
        <p className="mt-3 text-sm font-medium text-foreground">Pilih aktivitas</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Klik salah satu baris untuk melihat detail log.
        </p>
      </section>
    );
  }

  const metadataText = log.metadata
    ? JSON.stringify(log.metadata, null, 2)
    : "{}";

  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-gold-muted text-amber-800">
          <ScrollText aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <Badge tone={actionTone(log.action)}>{log.action}</Badge>
          <p className="mt-1 text-xs text-foreground-muted">
            {formatTimestamp(log.timestamp)}
          </p>
          <p className="text-[11px] text-foreground-muted">
            ID Log: #{log.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </header>

      <div>
        <p className="text-sm font-semibold text-foreground">Informasi Aktivitas</p>
        <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
          <Row label="User" value={log.actorName} />
          <Row label="Modul" value={log.module} />
          <Row label="Aktivitas" value={log.action} />
          <Row label="Target" value={log.targetType} />
          <RiskRow risk={log.riskLevel} />
          <Row label="IP Address" value={log.ipAddress ?? "—"} />
          <Row label="Perangkat" value="—" />
          <Row label="Lokasi" value="—" />
        </dl>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Detail Perubahan Data</p>
        <pre className="mt-2 max-h-56 overflow-auto rounded-md border bg-background p-3 text-[11px] leading-5 text-foreground">
          {metadataText}
        </pre>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0">{label}</dt>
      <dd className="break-all text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function RiskRow({ risk }: { risk: AuditLogView["riskLevel"] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0">Risk Level</dt>
      <dd>
        <Badge tone={riskTone[risk]}>{risk}</Badge>
      </dd>
    </div>
  );
}
