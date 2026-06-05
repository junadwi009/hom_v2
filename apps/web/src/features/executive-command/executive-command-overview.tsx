import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard, type MetricCardProps } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { formatIdr, formatIdrCompact, formatNumber } from "@/lib/format";

import type { OverviewKpis, OverviewState } from "./overview-loader";
import { RevenueClientsChart } from "./revenue-clients-chart";

const EMPTY_METRICS: MetricCardProps[] = [
  { label: "Pendapatan bulan ini", value: "—", helper: "Menunggu data studio", trend: "—", tone: "neutral" },
  { label: "Klien baru bulan ini", value: "—", helper: "Menunggu data studio", trend: "—", tone: "neutral" },
  { label: "Pembayaran tertunda", value: "—", helper: "Menunggu data studio", trend: "—", tone: "neutral" },
  { label: "Janji temu mendatang", value: "—", helper: "Menunggu data studio", trend: "—", tone: "neutral" },
];

export function ExecutiveCommandOverview({ state }: { state: OverviewState }) {
  const ready = state.status === "ready";
  const metricCards = ready ? buildMetricCards(state.kpis) : EMPTY_METRICS;

  return (
    <>
      <PageHeader
        eyebrow="Executive Command"
        title="Strategic Overview"
        description="Cockpit owner: tren pendapatan vs klien baru, KPI utama, dan hal yang perlu perhatian."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      <DashboardCard
        title="Pendapatan vs Klien Baru per Bulan"
        description="Tren pendapatan (pembayaran lunas) dibanding jumlah klien baru, 6 bulan terakhir."
      >
        {ready ? (
          <RevenueClientsChart series={state.series} />
        ) : (
          <StatePlaceholder state={state} />
        )}
      </DashboardCard>
      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Perlu perhatian"
          description="Hal operasional yang menahan pendapatan atau retensi klien."
        >
          {ready ? (
            <AttentionList attention={state.attention} />
          ) : (
            <StatePlaceholder state={state} />
          )}
        </DashboardCard>
        <DashboardCard
          title="Ringkasan periode"
          description="Cuplikan angka utama bulan berjalan."
        >
          {ready ? (
            <PeriodSummary kpis={state.kpis} />
          ) : (
            <StatePlaceholder state={state} />
          )}
        </DashboardCard>
      </section>
    </>
  );
}

function buildMetricCards(kpis: OverviewKpis): MetricCardProps[] {
  const hasPending = kpis.pendingPaymentsCount > 0;
  return [
    {
      label: "Pendapatan bulan ini",
      value: formatIdr(kpis.revenueThisMonthIdr),
      helper: "Pembayaran lunas bulan berjalan",
      trend: "bulan ini",
      tone: "success",
    },
    {
      label: "Klien baru bulan ini",
      value: formatNumber(kpis.newClientsThisMonth),
      helper: "Registrasi klien baru",
      trend: "bulan ini",
      tone: "info",
    },
    {
      label: "Pembayaran tertunda",
      value: formatNumber(kpis.pendingPaymentsCount),
      helper: `Total ${formatIdrCompact(kpis.pendingPaymentsTotalIdr)} belum tertagih`,
      trend: hasPending ? "perlu tindak lanjut" : "aman",
      tone: hasPending ? "warning" : "success",
    },
    {
      label: "Janji temu mendatang",
      value: formatNumber(kpis.upcomingAppointments),
      helper: "Sesi yang akan datang",
      trend: "terjadwal",
      tone: "info",
    },
  ];
}

function AttentionList({
  attention,
}: {
  attention: { lowSessionPackages: number; pendingPayments: number; noShowAppointments: number };
}) {
  const items = [
    {
      label: "Paket klien hampir habis",
      detail: "Sisa sesi ≤ 2 — peluang penawaran paket baru.",
      count: attention.lowSessionPackages,
    },
    {
      label: "Pembayaran tertunda",
      detail: "Belum tertagih — perlu tindak lanjut ke klien.",
      count: attention.pendingPayments,
    },
    {
      label: "Janji temu no-show",
      detail: "Klien tidak hadir — pengaruhi okupansi & pendapatan.",
      count: attention.noShowAppointments,
    },
  ];

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center justify-between gap-3 rounded-lg border bg-stone-50 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-foreground-muted">{item.detail}</p>
          </div>
          <span
            className={
              item.count > 0
                ? "shrink-0 rounded-md bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900"
                : "shrink-0 rounded-md bg-green-100 px-3 py-1 text-sm font-semibold text-green-800"
            }
          >
            {formatNumber(item.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PeriodSummary({ kpis }: { kpis: OverviewKpis }) {
  const rows = [
    { label: "Pendapatan bulan ini", value: formatIdr(kpis.revenueThisMonthIdr) },
    { label: "Klien baru bulan ini", value: formatNumber(kpis.newClientsThisMonth) },
    {
      label: "Pembayaran tertunda",
      value: `${formatNumber(kpis.pendingPaymentsCount)} · ${formatIdrCompact(kpis.pendingPaymentsTotalIdr)}`,
    },
    { label: "Janji temu mendatang", value: formatNumber(kpis.upcomingAppointments) },
  ];

  return (
    <dl className="divide-y">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-3 py-3 text-sm">
          <dt className="text-foreground-muted">{row.label}</dt>
          <dd className="font-semibold text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatePlaceholder({ state }: { state: OverviewState }) {
  const message =
    state.status === "unavailable"
      ? "Data sementara tidak tersedia. Coba lagi nanti."
      : "Data akan tampil setelah terhubung ke data studio.";

  return (
    <div className="flex h-40 items-center justify-center rounded-lg border bg-stone-50 text-sm text-foreground-muted">
      {message}
    </div>
  );
}
