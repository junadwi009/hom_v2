"use client";

import { Activity, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import {
  ClientKpiRow,
  type ClientKpi,
} from "@/features/clients/shared/clients-kpi-card";
import { ClientsToolbar } from "@/features/clients/shared/clients-toolbar";

import { AuditLogDetailPanel } from "./audit-log-detail-panel";
import { AuditLogTable } from "./audit-log-table";
import type { AuditLogView } from "./audit-logs-loader";

export function AuditLogsPage({ logs }: { logs: AuditLogView[] }) {
  const [selectedId, setSelectedId] = useState(logs[0]?.id ?? "");
  const selected = logs.find((log) => log.id === selectedId) ?? logs[0] ?? null;

  const highRisk = logs.filter(
    (log) => log.riskLevel === "high" || log.riskLevel === "critical",
  ).length;
  const mediumRisk = logs.filter((log) => log.riskLevel === "medium").length;
  const distinctActors = new Set(logs.map((log) => log.actorName)).size;
  const modules = [...new Set(logs.map((log) => log.module))];

  const kpis: ClientKpi[] = [
    {
      icon: Activity,
      label: "Total Aktivitas",
      value: String(logs.length),
      helper: "100 terbaru",
      accent: "info",
    },
    {
      icon: TriangleAlert,
      label: "Risk Tinggi",
      value: String(highRisk),
      helper: "high / critical",
      accent: highRisk > 0 ? "danger" : "default",
    },
    {
      icon: ShieldAlert,
      label: "Risk Sedang",
      value: String(mediumRisk),
      helper: "perlu perhatian",
      accent: "warning",
    },
    {
      icon: Users,
      label: "User Terlibat",
      value: String(distinctActors),
      helper: "aktor unik",
      accent: "default",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Settings"
        title="Audit Logs"
        description="Lihat semua aktivitas penting di sistem untuk menjaga keamanan dan transparansi."
      />

      <ClientKpiRow className="grid-cols-2 sm:grid-cols-4" items={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)] xl:col-span-2">
          <ClientsToolbar
            filters={[
              { label: "Modul", options: ["Semua", ...modules] },
              {
                label: "Risk",
                options: ["Semua", "low", "medium", "high", "critical"],
              },
            ]}
            searchPlaceholder="Cari aktivitas, user, modul..."
          />
          <div className="mt-4">
            {logs.length === 0 ? (
              <EmptyState
                title="Belum ada aktivitas"
                description="Audit log akan terisi otomatis saat ada aksi di sistem."
              />
            ) : (
              <AuditLogTable
                logs={logs}
                onSelect={setSelectedId}
                selectedId={selectedId}
              />
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <span>Menampilkan {logs.length} aktivitas terbaru</span>
            <span>Klik baris untuk melihat detail di panel kanan.</span>
          </div>
        </section>

        <div className="xl:col-span-1">
          <AuditLogDetailPanel log={selected} />
        </div>
      </div>
    </div>
  );
}
