"use client";

import { Building2, Download, Filter, Plus } from "lucide-react";
import { useState } from "react";

import { DemoButton } from "@/features/shell/demo-action";

import { ClientsPageHeader, HeaderSelect } from "../shared/clients-page-header";
import { ClientKpiRow } from "../shared/clients-kpi-card";
import { ClientTabs } from "../shared/clients-tabs";
import { ClientsToolbar } from "../shared/clients-toolbar";
import { CreateSegmentSheet } from "./create-segment-sheet";
import type { CreateSegmentFormAction } from "./create-segment-types";
import { SegmentDetailPanel } from "./segment-detail-panel";
import { SegmentTable } from "./segment-table";
import { segments, segmentsFilters, segmentsKpis, type Segment } from "./segments-data";

export function SegmentsPage({
  realSegments = [],
  createAction,
  canCreate = false,
}: {
  realSegments?: Segment[];
  createAction?: CreateSegmentFormAction;
  canCreate?: boolean;
} = {}) {
  const allSegments = [...realSegments, ...segments];
  const [selectedId, setSelectedId] = useState(allSegments[0].id);
  const [tab, setTab] = useState(0);
  const selected =
    allSegments.find((segment) => segment.id === selectedId) ?? allSegments[0];

  const visibleSegments = allSegments.filter((segment) =>
    tab === 0 ? true : tab === 1 ? segment.type === "System" : segment.type === "Custom",
  );

  return (
    <div className="space-y-4">
      <ClientsPageHeader
        actions={
          <>
            <HeaderSelect
              ariaLabel="Cabang"
              icon={<Building2 aria-hidden="true" className="size-4 text-foreground-muted" />}
              options={["Semua Cabang", "HOM Kemang", "HOM Menteng"]}
            />
            <DemoButton
              message="Panel filter lanjutan dibuka (demo)."
              size="sm"
              type="button"
              variant="secondary"
            >
              <Filter aria-hidden="true" className="size-4" />
              Filter
            </DemoButton>
            <DemoButton
              message="Mengekspor daftar segment (demo)."
              size="sm"
              type="button"
              variant="secondary"
            >
              <Download aria-hidden="true" className="size-4" />
              Export
            </DemoButton>
            {createAction ? (
              <CreateSegmentSheet action={createAction} canCreate={canCreate} />
            ) : (
              <DemoButton
                message="Form buat segment baru dibuka (demo)."
                size="sm"
                type="button"
              >
                <Plus aria-hidden="true" className="size-4" />
                Buat Segment Baru
              </DemoButton>
            )}
          </>
        }
        subtitle="Kelompokkan client berdasarkan karakteristik untuk komunikasi & marketing yang lebih efektif."
        title="Segments"
      />

      <ClientKpiRow
        className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
        items={segmentsKpis}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)] xl:col-span-2">
          <ClientTabs
            onChange={setTab}
            tabs={["Semua Segment", "System Segment", "Custom Segment"]}
          />
          <div className="mt-4">
            <ClientsToolbar
              filters={segmentsFilters}
              searchPlaceholder="Cari nama segment..."
            />
          </div>
          <div className="mt-4">
            <SegmentTable
              onSelect={setSelectedId}
              segments={visibleSegments}
              selectedId={selectedId}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <span>Menampilkan {visibleSegments.length} dari 12 segment</span>
            <span>Klik baris untuk melihat detail segment di panel kanan.</span>
          </div>
        </section>
        <div className="xl:col-span-1">
          <SegmentDetailPanel segment={selected} />
        </div>
      </div>
    </div>
  );
}
