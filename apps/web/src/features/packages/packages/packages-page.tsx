import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import type { PackagesPageState } from "./packages-page-state";
import { PackagesTable } from "./packages-table";

export function PackagesPage({ state }: { state: PackagesPageState }) {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Packages"
        description="Read-only package and membership catalog for operational reference."
      />
      <PackagesSummary state={state} />
      <DashboardCard
        title="Package catalog"
        description="Package type, sessions, validity, price, and status."
      >
        <PackagesContent state={state} />
      </DashboardCard>
    </>
  );
}

function PackagesSummary({ state }: { state: PackagesPageState }) {
  const ready = state.status === "ready";
  const rows = ready ? state.rows : [];
  const totalActive = rows.filter((row) => row.status === "active").length;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Total Paket"
        value={ready ? String(state.total) : "—"}
        helper="Seluruh paket & membership"
        trend={ready ? "katalog" : "—"}
        tone={ready ? "info" : "neutral"}
      />
      <MetricCard
        label="Paket Aktif"
        value={ready ? String(totalActive) : "—"}
        helper="Bisa dijual ke klien"
        trend={ready ? "aktif" : "—"}
        tone={ready ? "success" : "neutral"}
      />
      <MetricCard
        label="Ditampilkan"
        value={ready ? String(rows.length) : "—"}
        helper="Baris di halaman ini"
        trend={ready ? "halaman ini" : "—"}
        tone="neutral"
      />
    </section>
  );
}

function PackagesContent({ state }: { state: PackagesPageState }) {
  if (state.status === "ready") {
    return <PackagesTable rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="Belum ada paket"
        description="Belum ada paket terdaftar untuk ditampilkan."
      />
    );
  }

  if (state.status === "permission_denied") {
    return <PermissionDeniedState />;
  }

  if (state.status === "configuration_error") {
    return (
      <ErrorState
        title="Package configuration unavailable"
        description="The package catalog cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load packages"
      description="The package catalog is temporarily unavailable."
    />
  );
}
