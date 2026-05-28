import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

export default function ServicesLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Services"
        description="Preparing the service catalog."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </section>
      <DashboardCard title="Service catalog" description="Loading services.">
        <LoadingSkeleton className="h-64" />
      </DashboardCard>
    </>
  );
}
