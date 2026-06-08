"use client";

import { Sparkles, Upload } from "lucide-react";
import { useState } from "react";

import { DemoButton } from "@/features/shell/demo-action";

import { ClientsPageHeader } from "../shared/clients-page-header";
import { ClientKpiRow } from "../shared/clients-kpi-card";
import { ClientsToolbar } from "../shared/clients-toolbar";
import { ClientDetailPanel } from "./client-detail-panel";
import { ClientTable } from "./client-table";
import { CreateClientSheet } from "./create-client-sheet";
import type { CreateClientFormAction } from "./create-client-types";
import {
  managedClients,
  managementFilters,
  managementInsights,
  managementKpis,
  type ManagedClient,
} from "./management-data";

export function ClientManagementPage({
  realClients = [],
  createAction,
  canCreate = false,
}: {
  realClients?: ManagedClient[];
  createAction: CreateClientFormAction;
  canCreate?: boolean;
}) {
  const allClients = [...realClients, ...managedClients];
  const [selectedId, setSelectedId] = useState(managedClients[0].id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [riskFilter, setRiskFilter] = useState("Semua");
  const selected =
    allClients.find((client) => client.id === selectedId) ?? managedClients[0];

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
        actions={
          <>
            <DemoButton
              message="Import client: pilih file CSV/XLSX (demo)."
              size="sm"
              type="button"
              variant="secondary"
            >
              <Upload aria-hidden="true" className="size-4" />
              Import Client
            </DemoButton>
            <CreateClientSheet action={createAction} canCreate={canCreate} />
          </>
        }
        subtitle="Kelola semua client, pantau status, dan lakukan follow-up lebih efektif."
        title="Client Management"
      />

      <ClientKpiRow
        className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
        items={managementKpis}
      />

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
          <DemoButton
            className="shrink-0"
            message="Membuka rekomendasi AI lengkap untuk retensi & follow-up (demo)."
            size="sm"
            type="button"
            variant="secondary"
          >
            Lihat Rekomendasi Lengkap →
          </DemoButton>
        </div>
      </section>

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
            <ClientTable
              clients={visibleClients}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <span>
              Menampilkan {visibleClients.length} client ({realClients.length} dari
              database)
            </span>
            <span>Klik baris untuk melihat detail client di panel kanan.</span>
          </div>
        </section>

        <div className="xl:col-span-1">
          <ClientDetailPanel client={selected} />
        </div>
      </div>
    </div>
  );
}
