import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

export default function PractitionersLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Registry"
        title="Practitioners"
        description="Preparing the practitioner roster."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </section>
      <DashboardCard
        title="Practitioner catalog"
        description="Loading practitioners."
      >
        <LoadingSkeleton className="h-64" />
      </DashboardCard>
    </>
  );
}
