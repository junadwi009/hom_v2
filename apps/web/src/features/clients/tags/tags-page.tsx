"use client";

import { Building2, Download, Filter, Plus } from "lucide-react";
import { useState } from "react";

import { DemoButton } from "@/features/shell/demo-action";

import { ClientsPageHeader, HeaderSelect } from "../shared/clients-page-header";
import { ClientKpiRow } from "../shared/clients-kpi-card";
import { ClientTabs } from "../shared/clients-tabs";
import { ClientsToolbar } from "../shared/clients-toolbar";
import { CreateTagSheet } from "./create-tag-sheet";
import type { CreateTagFormAction } from "./create-tag-types";
import { TagsSidePanel } from "./tags-side-panel";
import { TagsTable } from "./tags-table";
import { clientTags, tagsFilters, tagsKpis, type ClientTag } from "./tags-data";

export function TagsPage({
  realTags = [],
  createAction,
  canCreate = false,
}: {
  realTags?: ClientTag[];
  createAction?: CreateTagFormAction;
  canCreate?: boolean;
} = {}) {
  const allTags = [...realTags, ...clientTags];
  const [tab, setTab] = useState(0);

  const visibleTags = allTags.filter((tagItem) =>
    tab === 0 ? true : tab === 1 ? tagItem.type === "System" : tagItem.type === "Custom",
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
              message="Mengekspor daftar tag (demo)."
              size="sm"
              type="button"
              variant="secondary"
            >
              <Download aria-hidden="true" className="size-4" />
              Export
            </DemoButton>
            {createAction ? (
              <CreateTagSheet action={createAction} canCreate={canCreate} />
            ) : (
              <DemoButton
                message="Form buat tag baru dibuka (demo)."
                size="sm"
                type="button"
              >
                <Plus aria-hidden="true" className="size-4" />
                Buat Tag Baru
              </DemoButton>
            )}
          </>
        }
        subtitle="Kelola label/tag untuk mengelompokkan client berdasarkan karakteristik dan kebutuhan."
        title="Tags"
      />

      <ClientKpiRow
        className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
        items={tagsKpis}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)] xl:col-span-2">
          <ClientTabs
            onChange={setTab}
            tabs={["Semua Tags", "System Tags", "Custom Tags"]}
          />
          <div className="mt-4">
            <ClientsToolbar filters={tagsFilters} searchPlaceholder="Cari tag..." />
          </div>
          <div className="mt-4">
            <TagsTable tags={visibleTags} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-muted">
            <span>Menampilkan {visibleTags.length} dari 28 tags</span>
            <span>Rows per page: 10</span>
          </div>
        </section>
        <div className="xl:col-span-1">
          <TagsSidePanel />
        </div>
      </div>
    </div>
  );
}
