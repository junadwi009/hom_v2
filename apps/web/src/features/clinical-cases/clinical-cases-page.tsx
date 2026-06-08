import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { MetricCard } from "@/components/hom/metric-card";
import { PageHeader } from "@/components/layout/page-header";

import { CreateClinicalCaseSheet } from "./create-clinical-case-sheet";
import type { CreateClinicalCaseFormAction } from "./create-clinical-case-types";
import type { ClientOption, ClinicalCaseView } from "./clinical-cases-loader";

const statusTone: Record<
  ClinicalCaseView["caseStatus"],
  "warning" | "info" | "success"
> = {
  open: "warning",
  monitoring: "info",
  resolved: "success",
};

const severityTone: Record<
  ClinicalCaseView["severity"],
  "neutral" | "warning" | "danger"
> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export function ClinicalCasesPage({
  cases,
  clients,
  createAction,
  canCreate = false,
}: {
  cases: ClinicalCaseView[];
  clients: ClientOption[];
  createAction?: CreateClinicalCaseFormAction;
  canCreate?: boolean;
}) {
  const openCount = cases.filter((c) => c.caseStatus === "open").length;
  const highCount = cases.filter((c) => c.severity === "high").length;

  return (
    <>
      <PageHeader
        eyebrow="Clinical"
        title="Chronic Case Registry"
        description="Registry kasus klinis klien yang tersimpan ke database studio (akses terbatas, audit risk high)."
        actions={
          createAction ? (
            <CreateClinicalCaseSheet
              action={createAction}
              canCreate={canCreate}
              clients={clients}
            />
          ) : undefined
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Case"
          value={String(cases.length)}
          helper="50 terbaru"
          trend="cases"
          tone="info"
        />
        <MetricCard
          label="Open"
          value={String(openCount)}
          helper="butuh tindak lanjut"
          trend="open"
          tone={openCount > 0 ? "warning" : "neutral"}
        />
        <MetricCard
          label="Severity High"
          value={String(highCount)}
          helper="prioritas tinggi"
          trend="high"
          tone={highCount > 0 ? "danger" : "neutral"}
        />
      </section>

      <DashboardCard
        title="Daftar Case"
        description="50 case terbaru berdasarkan tanggal dibuka."
      >
        {cases.length === 0 ? (
          <EmptyState
            title="Belum ada clinical case"
            description="Buat case pertama lewat tombol Buat Case."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-normal text-foreground-muted">
                  <th className="py-2 pr-4 font-medium">Dibuka</th>
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Judul</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => (
                  <tr className="border-b last:border-0" key={item.id}>
                    <td className="py-2.5 pr-4 whitespace-nowrap text-foreground-muted">
                      {item.openedOn}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-foreground">
                      {item.clientName}
                    </td>
                    <td className="py-2.5 pr-4 text-foreground">{item.title}</td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={statusTone[item.caseStatus]}>
                        {item.caseStatus}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <Badge tone={severityTone[item.severity]}>
                        {item.severity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </>
  );
}
