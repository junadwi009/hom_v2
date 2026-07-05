import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import type { ServicesPageState } from "./services-page-state";
import { ServicesTable } from "./services-table";

export function ServicesCatalogPage({ state }: { state: ServicesPageState }) {
  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Services"
        description="Read-only service catalog for operational reference."
      />
      <ServicesSummary state={state} />
      <DashboardCard
        title="Service catalog"
        description="Service category, duration, default price, and status."
      >
        <ServicesContent state={state} />
      </DashboardCard>
    </>
  );
}

function ServicesSummary({ state }: { state: ServicesPageState }) {
  const ready = state.status === "ready";
  const rows = ready ? state.rows : [];
  const totalActive = rows.filter((row) => row.status === "active").length;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Total Layanan"
        value={ready ? String(state.total) : "—"}
        helper="Seluruh layanan studio"
        trend={ready ? "katalog" : "—"}
        tone={ready ? "info" : "neutral"}
      />
      <MetricCard
        label="Layanan Aktif"
        value={ready ? String(totalActive) : "—"}
        helper="Bisa dibooking"
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

function ServicesContent({ state }: { state: ServicesPageState }) {
  if (state.status === "ready") {
    return <ServicesTable rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="Belum ada layanan"
        description="Belum ada layanan terdaftar untuk ditampilkan."
      />
    );
  }

  if (state.status === "permission_denied") {
    return <PermissionDeniedState />;
  }

  if (state.status === "configuration_error") {
    return (
      <ErrorState
        title="Catalog configuration unavailable"
        description="The service catalog cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load services"
      description="The service catalog is temporarily unavailable."
    />
  );
}
