"use client";

import { Building2, CheckCircle2, Crown, MapPin, Power } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import {
  ClientKpiRow,
  type ClientKpi,
} from "@/features/clients/shared/clients-kpi-card";
import { ClientsToolbar } from "@/features/clients/shared/clients-toolbar";

import { BranchDetailPanel } from "./branch-detail-panel";
import { BranchTable } from "./branch-table";
import type { BranchView } from "./branches-loader";
import { CreateBranchSheet } from "./create-branch-sheet";
import type { CreateBranchFormAction } from "./create-branch-types";

export function BranchManagementPage({
  branches,
  createAction,
  canCreate = false,
}: {
  branches: BranchView[];
  createAction?: CreateBranchFormAction;
  canCreate?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(branches[0]?.id ?? "");
  const selected =
    branches.find((branch) => branch.id === selectedId) ?? branches[0] ?? null;

  const activeCount = branches.filter((b) => b.status === "active").length;
  const mainCount = branches.filter((b) => b.branchType === "main").length;
  const inactiveCount = branches.filter((b) => b.status !== "active").length;
  const cities = [
    ...new Set(branches.map((b) => b.city).filter((c): c is string => Boolean(c))),
  ];

  const kpis: ClientKpi[] = [
    {
      icon: Building2,
      label: "Total Branches",
      value: String(branches.length),
      helper: "cabang terdaftar",
      accent: "info",
    },
    {
      icon: CheckCircle2,
      label: "Active Branches",
      value: String(activeCount),
      helper:
        branches.length > 0
          ? `${Math.round((activeCount / branches.length) * 100)}% dari total`
          : "0% dari total",
      accent: "success",
    },
    {
      icon: Crown,
      label: "Main Branch",
      value: String(mainCount),
      helper: "kantor pusat",
      accent: "warning",
    },
    {
      icon: MapPin,
      label: "Kota",
      value: String(cities.length),
      helper: "lokasi berbeda",
      accent: "default",
    },
    {
      icon: Power,
      label: "Inactive",
      value: String(inactiveCount),
      helper: "perlu ditinjau",
      accent: inactiveCount > 0 ? "danger" : "default",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Settings"
        title="Branch Management"
        description="Kelola semua cabang studio Anda dalam satu sistem."
        actions={
          createAction ? (
            <CreateBranchSheet action={createAction} canCreate={canCreate} />
          ) : undefined
        }
      />

      <ClientKpiRow
        className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
        items={kpis}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)] xl:col-span-2">
          <ClientsToolbar
            filters={[
              { label: "Status", options: ["Semua", "Active", "Inactive", "Archived"] },
              { label: "Kota", options: ["Semua", ...cities] },
            ]}
            searchPlaceholder="Cari cabang..."
          />
          <div className="mt-4">
            {branches.length === 0 ? (
              <EmptyState
                title="Belum ada cabang"
                description="Tambahkan cabang pertama lewat tombol Add Branch."
              />
            ) : (
              <BranchTable
                branches={branches}
                onSelect={setSelectedId}
                selectedId={selectedId}
              />
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <span>Menampilkan {branches.length} cabang</span>
            <span>Klik baris untuk melihat detail di panel kanan.</span>
          </div>
        </section>

        <div className="xl:col-span-1">
          <BranchDetailPanel branch={selected} />
        </div>
      </div>
    </div>
  );
}
