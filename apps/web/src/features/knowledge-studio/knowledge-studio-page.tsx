import type { ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PermissionDeniedState } from "@/components/feedback/permission-denied-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";

import { KnowledgeSourcesTable } from "./knowledge-sources-table";
import type { KnowledgeStudioPageState } from "./knowledge-studio-page-state";

export function KnowledgeStudioPage({
  state,
  uploadSlot,
  testLabSlot,
}: {
  state: KnowledgeStudioPageState;
  uploadSlot: ReactNode;
  testLabSlot: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Management"
        title="Knowledge Studio"
        description="Unggah dokumen (Excel, PDF, gambar) jadi knowledge base yang bisa ditanya."
      />
      {state.source === "mock" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Mode preview (mock). Upload &amp; Test Lab aktif saat data mode = supabase.
        </div>
      ) : null}
      <KnowledgeStudioPageContent state={state} uploadSlot={uploadSlot} testLabSlot={testLabSlot} />
    </div>
  );
}

function KnowledgeStudioPageContent({
  state,
  uploadSlot,
  testLabSlot,
}: {
  state: KnowledgeStudioPageState;
  uploadSlot: ReactNode;
  testLabSlot: ReactNode;
}) {
  if (state.status === "permission_denied") {
    return <PermissionDeniedState />;
  }

  if (state.status === "configuration_error") {
    return (
      <ErrorState
        title="Knowledge Studio configuration unavailable"
        description="Konfigurasi Supabase belum aktif untuk knowledge."
      />
    );
  }

  if (state.status === "error") {
    return <ErrorState title="Could not load knowledge sources" description={state.message} />;
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Upload Dokumen" description="Excel / CSV / PDF / JPG / PNG">
          {uploadSlot}
        </DashboardCard>
        <DashboardCard title="Test Lab" description="Tanya knowledge yang sudah dipublish">
          {testLabSlot}
        </DashboardCard>
      </div>
      <DashboardCard title="Knowledge Sources">
        {state.status === "ready" ? (
          <KnowledgeSourcesTable rows={state.sources} />
        ) : (
          <EmptyState
            title="Belum ada dokumen"
            description="Unggah dokumen pertama lewat panel Upload."
          />
        )}
      </DashboardCard>
    </>
  );
}
