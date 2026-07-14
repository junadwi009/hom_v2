"use client";

import {
  Building2,
  DoorOpen,
  ParkingCircle,
  ShowerHead,
  Sofa,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { ClientTabs } from "@/features/clients/shared/clients-tabs";

import type { BranchView } from "./branches-loader";

const statusTone: Record<BranchView["status"], "success" | "neutral" | "warning"> =
  {
    active: "success",
    inactive: "neutral",
    archived: "warning",
  };

// Generic studio facility template — per-branch facilities are not modeled yet.
const facilityTemplate = [
  { icon: Building2, label: "Yoga Room" },
  { icon: DoorOpen, label: "Changing Room" },
  { icon: ShowerHead, label: "Shower" },
  { icon: Sofa, label: "Reception" },
  { icon: ParkingCircle, label: "Parking Area" },
];

export function BranchDetailPanel({ branch }: { branch: BranchView | null }) {
  if (!branch) {
    return (
      <section className="flex h-full flex-col items-center justify-center rounded-lg border bg-background-card p-8 text-center shadow-[var(--shadow-soft)]">
        <Building2 aria-hidden="true" className="size-8 text-foreground-muted" />
        <p className="mt-3 text-sm font-medium text-foreground">
          Pilih cabang
        </p>
        <p className="mt-1 text-xs text-foreground-muted">
          Klik salah satu baris untuk melihat detail cabang.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-stone-100">
        <Building2 aria-hidden="true" className="size-9 text-amber-700/70" />
      </div>

      <header>
        <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
          {branch.name}
          <Badge tone={branch.branchType === "main" ? "info" : "neutral"}>
            {branch.branchType === "main" ? "Main Branch" : "Satellite"}
          </Badge>
          <Badge tone={statusTone[branch.status]}>{branch.status}</Badge>
        </p>
        <p className="mt-1 text-xs text-foreground-muted">
          {[branch.address, branch.city].filter(Boolean).join(", ") || "—"}
        </p>
      </header>

      <ClientTabs
        tabs={["Overview", "Settings", "Operating Hours", "Staff", "Facilities"]}
      />

      <div>
        <p className="text-sm font-semibold text-foreground">
          Ringkasan Performa (MTD)
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <MiniStat label="Revenue" value="—" />
          <MiniStat label="Bookings" value="—" />
          <MiniStat label="Members" value="—" />
          <MiniStat label="Occupancy" value="—" />
        </div>
        <p className="mt-1.5 text-[11px] text-foreground-muted">
          Metrik performa belum dimodelkan untuk cabang.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Informasi Cabang</p>
        <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
          <Row label="Manager" value={branch.managerName ?? "—"} />
          <Row label="No. Telepon" value={branch.phone ?? "—"} />
          <Row label="Email" value={branch.email ?? "—"} />
          <Row
            label="Tipe Cabang"
            value={branch.branchType === "main" ? "Main Branch" : "Satellite"}
          />
          <Row label="Status" value={branch.status} />
          <Row label="Kota" value={branch.city ?? "—"} />
        </dl>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Fasilitas</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {facilityTemplate.map((facility) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs text-foreground-muted"
              key={facility.label}
            >
              <facility.icon aria-hidden="true" className="size-3.5" />
              {facility.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="text-[11px] text-foreground-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
