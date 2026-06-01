import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

export default function AppointmentsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Appointments"
        description="Preparing the appointment schedule."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <LoadingSkeleton />
        <LoadingSkeleton />
        <LoadingSkeleton />
      </section>
      <DashboardCard title="Appointment schedule" description="Loading appointments.">
        <LoadingSkeleton className="h-64" />
      </DashboardCard>
    </>
  );
}
