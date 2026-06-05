import { DashboardCard } from "@/components/hom/dashboard-card";
import type { MetricCardProps } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";

export type ModuleMockPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  metrics: MetricCardProps[];
  columns: string[];
  rows: Array<Record<string, string>>;
};

// Placeholder for modules whose backend is not built yet. Renders a clean
// "coming soon" state (no mock tables, no error/skeleton artifacts) so the app
// never looks broken to an owner or staff member.
export function ModuleMockPage({ eyebrow, title }: ModuleMockPageProps) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description="Modul ini sedang dalam pengembangan dan akan hadir pada rilis berikutnya."
        actions={<Badge tone="info">Segera hadir</Badge>}
      />
      <DashboardCard
        title={`${title} — segera hadir`}
        description="Fitur ini belum aktif. Fokus saat ini pada modul operasional yang sudah berjalan: Appointments, Clients, Packages, dan Payments."
      >
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">Belum tersedia</p>
          <p className="max-w-md text-sm leading-6 text-foreground-muted">
            Tim sedang menyiapkan modul {title}. Hubungi admin bila Anda
            membutuhkan kapabilitas ini lebih awal.
          </p>
        </div>
      </DashboardCard>
    </>
  );
}
