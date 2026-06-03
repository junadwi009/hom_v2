import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

export default function PackagesLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Packages"
        description="Preparing the package catalog."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </section>
      <DashboardCard title="Package catalog" description="Loading packages.">
        <LoadingSkeleton className="h-64" />
      </DashboardCard>
    </>
  );
}
