import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { createFinancialEntryAction } from "@/features/financials/create-financial-entry-action";
import { FinancialsPage } from "@/features/financials/financials-page";
import { loadFinancialEntries } from "@/features/financials/financials-loader";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [entries, currentUser] = await Promise.all([
    loadFinancialEntries(),
    getCurrentUser().catch(() => null),
  ]);

  const permissions = currentUser?.permissions ?? [];
  const canView = permissions.includes("can_view_financials");
  const canCreate = permissions.includes("can_edit_financials");
  const canExport = permissions.includes("can_export_financial_report");

  if (!canView) {
    return (
      <>
        <PageHeader
          eyebrow="Finance"
          title="Financial Overview"
          description="Ringkasan keuangan studio Anda berdasarkan data income dan expense."
          actions={<Badge tone="warning">Akses ditolak</Badge>}
        />
        <DashboardCard
          title="Tidak memiliki akses"
          description="Modul ini hanya untuk yang berhak melihat data finansial."
        >
          <p className="text-sm leading-6 text-foreground-muted">
            Anda tidak memiliki izin <code>can_view_financials</code>. Hubungi
            administrator studio bila Anda membutuhkan akses ini.
          </p>
        </DashboardCard>
      </>
    );
  }

  return (
    <FinancialsPage
      canCreate={canCreate}
      canExport={canExport}
      createAction={createFinancialEntryAction}
      entries={entries}
    />
  );
}
