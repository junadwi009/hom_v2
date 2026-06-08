"use client";

import { CalendarDays, Download, Filter, Plus, Sparkles } from "lucide-react";
import { useState } from "react";

import { DemoButton } from "@/features/shell/demo-action";

import { ClientsPageHeader, HeaderSelect } from "../shared/clients-page-header";
import { ClientKpiRow } from "../shared/clients-kpi-card";
import { ClientsToolbar } from "../shared/clients-toolbar";
import { CreateLeadSheet } from "./create-lead-sheet";
import type { CreateLeadFormAction } from "./create-lead-types";
import { LeadDetailPanel } from "./lead-detail-panel";
import { LeadFunnel } from "./lead-funnel";
import { LeadTable } from "./lead-table";
import { leads, leadsFilters, leadsInsights, leadsKpis, type Lead } from "./leads-data";

export function LeadsPage({
  realLeads = [],
  createAction,
  canCreate = false,
}: {
  realLeads?: Lead[];
  createAction?: CreateLeadFormAction;
  canCreate?: boolean;
} = {}) {
  const allLeads = [...realLeads, ...leads];
  const [selectedId, setSelectedId] = useState(allLeads[0].id);
  const [query, setQuery] = useState("");
  const [sumberFilter, setSumberFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [tahapFilter, setTahapFilter] = useState("Semua");
  const selected = allLeads.find((lead) => lead.id === selectedId) ?? allLeads[0];

  const visibleLeads = allLeads.filter((lead) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q === "" ||
      lead.name.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q);
    const matchesSumber = sumberFilter === "Semua" || lead.source === sumberFilter;
    const matchesStatus = statusFilter === "Semua" || lead.status === statusFilter;
    const matchesTahap = tahapFilter === "Semua" || lead.stage === tahapFilter;
    return matchesQuery && matchesSumber && matchesStatus && matchesTahap;
  });

  const handleFilterChange = (label: string, value: string) => {
    if (label === "Sumber") setSumberFilter(value);
    if (label === "Status") setStatusFilter(value);
    if (label === "Tahap") setTahapFilter(value);
  };

  const handleReset = () => {
    setQuery("");
    setSumberFilter("Semua");
    setStatusFilter("Semua");
    setTahapFilter("Semua");
  };

  return (
    <div className="space-y-4">
      <ClientsPageHeader
        actions={
          <>
            <HeaderSelect
              ariaLabel="Rentang tanggal"
              icon={<CalendarDays aria-hidden="true" className="size-4 text-foreground-muted" />}
              options={["1 - 7 Jun 2025", "Bulan ini", "30 hari terakhir"]}
            />
            <DemoButton
              message="Panel filter lanjutan dibuka (demo)."
              size="sm"
              type="button"
              variant="secondary"
            >
              <Filter aria-hidden="true" className="size-4" />
              Filter
            </DemoButton>
            <DemoButton
              message="Mengekspor daftar lead ke CSV (demo)."
              size="sm"
              type="button"
              variant="secondary"
            >
              <Download aria-hidden="true" className="size-4" />
              Export
            </DemoButton>
            {createAction ? (
              <CreateLeadSheet action={createAction} canCreate={canCreate} />
            ) : (
              <DemoButton
                message="Form tambah lead dibuka (demo)."
                size="sm"
                type="button"
              >
                <Plus aria-hidden="true" className="size-4" />
                Tambah Lead
              </DemoButton>
            )}
          </>
        }
        subtitle="Kelola calon member dan ubah menjadi member aktif."
        title="Leads"
      />

      <ClientKpiRow
        className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
        items={leadsKpis}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border border-accent-gold-muted bg-accent-gold-muted/20 p-4 xl:col-span-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
            AI Insight &amp; Rekomendasi Hari Ini
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground-muted">
            {leadsInsights.map((insight) => (
              <li className="flex items-start gap-1.5" key={insight}>
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-600" />
                {insight}
              </li>
            ))}
          </ul>
        </section>
        <div className="xl:col-span-1">
          <LeadFunnel />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)] xl:col-span-2">
          <ClientsToolbar
            filters={leadsFilters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
            onSearch={setQuery}
            query={query}
            searchPlaceholder="Cari nama, nomor, email..."
          />
          <div className="mt-4">
            <LeadTable
              leads={visibleLeads}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <span>Menampilkan {visibleLeads.length} dari 142 lead</span>
            <span>Klik baris untuk melihat detail lead di panel kanan.</span>
          </div>
        </section>
        <div className="xl:col-span-1">
          <LeadDetailPanel lead={selected} />
        </div>
      </div>
    </div>
  );
}
