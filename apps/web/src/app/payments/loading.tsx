import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

export default function PaymentsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Preparing the payment records."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </section>
      <DashboardCard title="Manual payments" description="Loading payments.">
        <LoadingSkeleton className="h-64" />
      </DashboardCard>
    </>
  );
}
