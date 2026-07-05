import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { ClientsTable } from "./clients-table";
import type { ClientDetailAction } from "./client-detail-types";
import type { ClientsPageState } from "./clients-page-state";

export function ClientsCatalogPage({
  state,
  detailAction,
}: {
  state: ClientsPageState;
  detailAction?: ClientDetailAction;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Clients"
        description="Current client roster and practitioner ownership for operational review."
      />
      <ClientsSummary state={state} />
      <DashboardCard
        title="Client catalog"
        description="Client status, practitioner utama, dan detail profil per klien."
      >
        <ClientsContent detailAction={detailAction} state={state} />
      </DashboardCard>
    </>
  );
}

function ClientsSummary({ state }: { state: ClientsPageState }) {
  const ready = state.status === "ready";
  const rows = ready ? state.rows : [];
  const totalActive = rows.filter((row) => row.status === "active").length;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <MetricCard
        label="Total Klien"
        value={ready ? String(state.total) : "—"}
        helper="Seluruh klien terdaftar"
        trend={ready ? "terdaftar" : "—"}
        tone={ready ? "info" : "neutral"}
      />
      <MetricCard
        label="Klien Aktif"
        value={ready ? String(totalActive) : "—"}
        helper="Berstatus aktif"
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

function ClientsContent({
  state,
  detailAction,
}: {
  state: ClientsPageState;
  detailAction?: ClientDetailAction;
}) {
  if (state.status === "ready") {
    return <ClientsTable detailAction={detailAction} rows={state.rows} />;
  }

  if (state.status === "empty") {
    return (
      <EmptyState
        title="Belum ada klien"
        description="Belum ada klien terdaftar untuk ditampilkan."
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
        description="The client roster cannot be loaded from the selected source."
      />
    );
  }

  return (
    <ErrorState
      title="Could not load clients"
      description="The client roster is temporarily unavailable."
    />
  );
}
