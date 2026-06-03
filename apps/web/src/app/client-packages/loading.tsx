import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

export default function ClientPackagesLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Client Packages"
        description="Preparing package ownership."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </section>
      <DashboardCard
        title="Client package ownership"
        description="Loading client packages."
      >
        <LoadingSkeleton className="h-64" />
      </DashboardCard>
    </>
  );
}
