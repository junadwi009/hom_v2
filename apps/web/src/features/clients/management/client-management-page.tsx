"use client";

import { Sparkles, UserCheck, UserPlus, Users } from "lucide-react";
import { useState } from "react";

import { ClientsPageHeader } from "../shared/clients-page-header";
import { ClientKpiRow, type ClientKpi } from "../shared/clients-kpi-card";
import { ClientsToolbar } from "../shared/clients-toolbar";
import { ClientDetailPanel } from "./client-detail-panel";
import { ClientTable } from "./client-table";
import { CreateClientSheet } from "./create-client-sheet";
import type { CreateClientFormAction } from "./create-client-types";
import type { ManagementKpis } from "./management-kpis-loader";
import {
  managedClients,
  managementFilters,
  managementInsights,
  managementKpis,
  type ManagedClient,
} from "./management-data";

// Honest KPI cards computed from real client data. When kpis is null (load
// failure), show "—" — never fake zeros. At-risk/VIP/expiring cards from the
// old fabricated set are intentionally absent until they can be computed.
function buildRealKpiCards(kpis: ManagementKpis | null): ClientKpi[] {
  const value = (n: number | undefined) => (kpis ? String(n ?? 0) : "—");
  return [
    {
      icon: Users,
      label: "Total Klien",
      value: value(kpis?.totalClients),
      helper: "Seluruh klien terdaftar",
      accent: "info",
    },
    {
      icon: UserCheck,
      label: "Klien Aktif",
      value: value(kpis?.activeClients),
      helper: "Berstatus aktif",
      accent: "success",
    },
    {
      icon: UserPlus,
      label: "Klien Baru Bulan Ini",
      value: value(kpis?.newClientsThisMonth),
      helper: "Registrasi bulan berjalan",
      accent: "default",
    },
    {
      icon: UserPlus,
      label: "Prospek / Trial",
      value: value(kpis?.prospectClients),
      helper: "Belum jadi member",
      accent: "warning",
    },
  ];
}

export function ClientManagementPage({
  realClients = [],
  createAction,
  canCreate = false,
  dataSource = "mock",
  kpis = null,
}: {
  realClients?: ManagedClient[];
  createAction: CreateClientFormAction;
  canCreate?: boolean;
  dataSource?: "supabase" | "mock";
  kpis?: ManagementKpis | null;
}) {
  const isSupabase = dataSource === "supabase";
  // Supabase mode shows ONLY real clients; the labeled local seed is a
  // fallback for mock/local mode (same pattern as the Approval Center).
  const allClients = isSupabase ? realClients : [...realClients, ...managedClients];
  const kpiCards = isSupabase ? buildRealKpiCards(kpis) : managementKpis;
  const [selectedId, setSelectedId] = useState<string | null>(
    allClients[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [riskFilter, setRiskFilter] = useState("Semua");
  const selected =
    allClients.find((client) => client.id === selectedId) ?? allClients[0] ?? null;

  const visibleClients = allClients.filter((client) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === "" ||
      client.name.toLowerCase().includes(q) ||
      client.phone.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "Semua" || client.status === statusFilter;
    const matchesRisk = riskFilter === "Semua" || client.riskLevel === riskFilter;
    return matchesQuery && matchesStatus && matchesRisk;
  });

  const handleFilterChange = (label: string, value: string) => {
    if (label === "Status") setStatusFilter(value);
    if (label === "Risk Level") setRiskFilter(value);
  };

  const handleReset = () => {
    setQuery("");
    setStatusFilter("Semua");
    setRiskFilter("Semua");
  };

  return (
    <div className="space-y-4">
      <ClientsPageHeader
        actions={<CreateClientSheet action={createAction} canCreate={canCreate} />}
        subtitle="Kelola semua client, pantau status, dan lakukan follow-up lebih efektif."
        title="Client Management"
      />

      <ClientKpiRow
        className={
          isSupabase
            ? "grid-cols-2 xl:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
        }
        items={kpiCards}
      />

      {/* The fabricated "AI Insight" strip only renders in mock/local mode.
          The real AI summary lives on the Overview cockpit. */}
      {isSupabase ? null : (
        <section className="rounded-lg border border-accent-gold-muted bg-accent-gold-muted/20 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <p className="flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
              AI Insight Hari Ini
            </p>
            <ul className="flex flex-1 flex-col gap-1 text-sm text-foreground-muted lg:flex-row lg:flex-wrap lg:gap-x-6">
              {managementInsights.map((insight) => (
                <li className="flex items-start gap-1.5" key={insight}>
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-600" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)] xl:col-span-2">
          <ClientsToolbar
            filters={managementFilters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onSearch={setQuery}
            query={query}
            searchPlaceholder="Cari nama, email, atau nomor..."
          />
          <div className="mt-4">
            {visibleClients.length > 0 ? (
              <ClientTable
                clients={visibleClients}
                onSelect={setSelectedId}
                selectedId={selectedId ?? ""}
              />
            ) : (
              <p className="rounded-lg border bg-stone-50 px-4 py-8 text-center text-sm text-foreground-muted">
                Belum ada klien untuk ditampilkan.
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <span>Menampilkan {visibleClients.length} klien</span>
            <span>Klik baris untuk melihat detail client di panel kanan.</span>
          </div>
        </section>

        <div className="xl:col-span-1">
          {selected ? (
            <ClientDetailPanel client={selected} />
          ) : (
            <section className="flex h-full min-h-40 items-center justify-center rounded-lg border bg-background-card p-5 text-sm text-foreground-muted shadow-[var(--shadow-soft)]">
              Pilih klien untuk melihat detail.
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
