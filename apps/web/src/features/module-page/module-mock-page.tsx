import { FilterBar } from "@/components/layout/filter-bar";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { DataTable } from "@/components/hom/data-table";
import { MetricCard, type MetricCardProps } from "@/components/hom/metric-card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { Button } from "@/components/ui/button";

export type ModuleMockPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics: MetricCardProps[];
  columns: string[];
  rows: Array<Record<string, string>>;
};

export function ModuleMockPage({
  eyebrow,
  title,
  description,
  metrics,
  columns,
  rows,
}: ModuleMockPageProps) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <Button type="button" variant="secondary">Export mock</Button>
            <Button type="button">Create draft</Button>
          </>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>
      <FilterBar />
      <DashboardCard title={`${title} worklist`} description="Mock data only. Backend validation and persistence are deferred.">
        <DataTable columns={columns} rows={rows} />
      </DashboardCard>
      <section className="grid gap-4 lg:grid-cols-3">
        <LoadingSkeleton />
        <ErrorState title="Mock load failure" description="Real retries will be wired after APIs exist." />
        <PermissionDeniedState />
      </section>
    </>
  );
}
