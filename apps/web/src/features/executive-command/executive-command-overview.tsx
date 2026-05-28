import { DashboardCard } from "@/components/hom/dashboard-card";
import { DataTable } from "@/components/hom/data-table";
import { MetricCard } from "@/components/hom/metric-card";
import { StatusBadge } from "@/components/hom/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { attentionItems, executiveMetrics, practitionerRows } from "@/lib/mock-data";

export function ExecutiveCommandOverview() {
  return (
    <>
      <PageHeader
        eyebrow="Executive Command"
        title="Strategic Overview"
        description="Operational foundation first: attention items, safe mock metrics, and review queues before production dashboards."
        actions={
          <>
            <Button type="button" variant="secondary">Mock period: May 2026</Button>
            <Button type="button">Open approvals</Button>
          </>
        }
      />
      <section className="grid gap-4 lg:grid-cols-4">
        {attentionItems.map((item) => (
          <DashboardCard key={item.title} title={item.title} description={item.detail}>
            <div className="flex items-center justify-between gap-3">
              <p className="shrink-0 whitespace-nowrap text-2xl font-semibold tracking-normal text-foreground">{item.value}</p>
              <StatusBadge status={item.status === "danger" ? "blocked" : "pending"} />
            </div>
          </DashboardCard>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {executiveMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <DashboardCard title="Revenue growth" description="Static mock chart placeholder with period/source labeling.">
          <div className="flex h-64 items-end gap-3 rounded-lg border bg-stone-50 p-4">
            {[42, 56, 48, 68, 74, 88].map((height, index) => (
              <div className="flex flex-1 flex-col items-center gap-2" key={height}>
                <div
                  className="w-full rounded-md bg-[var(--accent-gold)]"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-foreground-muted">M{index + 1}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
        <DashboardCard title="AI intelligence" description="AI is represented as draft-only in Phase 1.">
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border bg-stone-50 p-3">
              <p className="font-medium text-foreground">Read-only summary shell</p>
              <p className="mt-1 leading-6 text-foreground-muted">
                Real AI Gateway, sources, model logs, and policy guard are deferred.
              </p>
            </div>
            <div className="rounded-lg border bg-stone-50 p-3">
              <p className="font-medium text-foreground">Sensitive action boundary</p>
              <p className="mt-1 leading-6 text-foreground-muted">
                Finance, appointments, notes, refunds, payroll, and blasts require human approval later.
              </p>
            </div>
          </div>
        </DashboardCard>
      </section>
      <DashboardCard title="Practitioner metrics" description="Mock utilization table for layout validation only.">
        <DataTable
          columns={["Practitioner", "Utilization", "Sessions", "Status"]}
          rows={practitionerRows.map((row) => ({
            Practitioner: row.practitioner,
            Utilization: row.utilization,
            Sessions: row.sessions,
            Status: row.status,
          }))}
        />
      </DashboardCard>
    </>
  );
}
