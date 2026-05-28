import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

export default function ClientsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Clients"
        description="Preparing the client roster."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </section>
      <DashboardCard title="Client catalog" description="Loading clients.">
        <LoadingSkeleton className="h-64" />
      </DashboardCard>
    </>
  );
}
