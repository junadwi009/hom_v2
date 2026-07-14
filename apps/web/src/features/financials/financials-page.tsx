"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  ExternalLink,
  FileText,
  Receipt,
  ScrollText,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { DashboardCard } from "@/components/hom/dashboard-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClientKpiRow,
  type ClientKpi,
} from "@/features/clients/shared/clients-kpi-card";
import { useToast } from "@/features/shell/toast";
import { formatCompactIDR, formatCurrencyIDR, formatDateID } from "@/lib/format";

import {
  calculateFinancialHealthScore,
  categoryTotals,
  computeFinancialKpis,
  FINANCIAL_PERIODS,
  filterByPeriod,
  generateFinancialInsight,
  trendBuckets,
  type FinancialPeriod,
} from "./financials-analytics";
import { CategoryBars, TrendBars } from "./financials-charts";
import { CreateFinancialEntrySheet } from "./create-financial-entry-sheet";
import type { CreateFinancialEntryFormAction } from "./create-financial-entry-types";
import type { FinancialEntryView } from "./financials-loader";

const inputClass =
  "h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted";

export function FinancialsPage({
  entries,
  createAction,
  canCreate = false,
  canExport = false,
}: {
  entries: FinancialEntryView[];
  createAction?: CreateFinancialEntryFormAction;
  canCreate?: boolean;
  canExport?: boolean;
}) {
  const router = useRouter();
  const notify = useToast();
  const searchParams = useSearchParams();
  const wantCreate = searchParams.get("create") === "1";
  const wantExport = searchParams.get("export") === "1";

  const [period, setPeriod] = useState<FinancialPeriod>("this_month");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const periodEntries = useMemo(
    () => filterByPeriod(entries, period),
    [entries, period],
  );
  const kpis = useMemo(() => computeFinancialKpis(periodEntries), [periodEntries]);
  const health = useMemo(() => calculateFinancialHealthScore(kpis), [kpis]);
  const insight = useMemo(() => generateFinancialInsight(kpis), [kpis]);
  const incomeCats = useMemo(
    () => categoryTotals(periodEntries, "income"),
    [periodEntries],
  );
  const expenseCats = useMemo(
    () => categoryTotals(periodEntries, "expense"),
    [periodEntries],
  );
  const trend = useMemo(
    () => trendBuckets(periodEntries, period),
    [periodEntries, period],
  );

  const categories = useMemo(
    () => [...new Set(periodEntries.map((e) => e.category))].sort(),
    [periodEntries],
  );

  const tableEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periodEntries.filter((entry) => {
      const matchesType = typeFilter === "all" || entry.entryType === typeFilter;
      const matchesCat = categoryFilter === "all" || entry.category === categoryFilter;
      const matchesSearch =
        q === "" ||
        entry.category.toLowerCase().includes(q) ||
        (entry.note ?? "").toLowerCase().includes(q);
      return matchesType && matchesCat && matchesSearch;
    });
  }, [periodEntries, search, typeFilter, categoryFilter]);

  const exportCsv = useCallback(() => {
    if (!canExport) {
      notify("Anda tidak memiliki izin export laporan finansial.");
      return;
    }
    const header = ["Tanggal", "Tipe", "Kategori", "Jumlah_IDR", "Catatan"];
    const rows = periodEntries.map((e) => [
      e.occurredOn,
      e.entryType,
      e.category,
      String(e.amountIdr),
      (e.note ?? "").replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-report-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Laporan CSV diunduh.");
  }, [canExport, notify, period, periodEntries]);

  // Honour the `?export=1` topbar deep link: fire once, then clean the URL so a
  // reload won't re-download. Resets when the param is cleared so a later click
  // works again.
  const exportHandledRef = useRef(false);
  useEffect(() => {
    if (wantExport && !exportHandledRef.current) {
      exportHandledRef.current = true;
      exportCsv();
      router.replace("/financials");
    } else if (!wantExport) {
      exportHandledRef.current = false;
    }
  }, [wantExport, exportCsv, router]);

  const periodLabel =
    FINANCIAL_PERIODS.find((p) => p.value === period)?.label ?? "";

  const kpiCards: ClientKpi[] = [
    {
      icon: TrendingUp,
      label: `Revenue (${periodLabel})`,
      value: formatCompactIDR(kpis.income),
      helper: `${kpis.incomeCount} transaksi`,
      accent: "success",
    },
    {
      icon: TrendingDown,
      label: `Expense (${periodLabel})`,
      value: formatCompactIDR(kpis.expense),
      helper: `${kpis.expenseCount} transaksi`,
      accent: "danger",
    },
    {
      icon: Wallet,
      label: "Net Cashflow",
      value: formatCompactIDR(kpis.net),
      helper: kpis.net >= 0 ? "surplus" : "defisit",
      accent: kpis.net >= 0 ? "info" : "warning",
    },
    {
      icon: ArrowUpRight,
      label: "Income Terbesar",
      value: kpis.largestIncome?.category ?? "—",
      helper: kpis.largestIncome
        ? formatCompactIDR(kpis.largestIncome.amount)
        : "Belum tersedia",
      accent: "success",
    },
    {
      icon: ArrowDownRight,
      label: "Expense Terbesar",
      value: kpis.largestExpense?.category ?? "—",
      helper: kpis.largestExpense
        ? formatCompactIDR(kpis.largestExpense.amount)
        : "Belum tersedia",
      accent: "danger",
    },
    {
      icon: Receipt,
      label: "Entri Periode Ini",
      value: String(kpis.entryCount),
      helper: "financial entries",
      accent: "default",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Finance"
        title="Financial Overview"
        description="Ringkasan keuangan studio Anda berdasarkan data income dan expense."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Periode"
              className={inputClass}
              onChange={(e) => setPeriod(e.target.value as FinancialPeriod)}
              value={period}
            >
              {FINANCIAL_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <Button
              disabled={!canExport}
              onClick={exportCsv}
              size="sm"
              title={canExport ? undefined : "Butuh izin can_export_financial_report."}
              type="button"
              variant="secondary"
            >
              <Download aria-hidden="true" className="size-4" />
              Export Report
            </Button>
            {createAction ? (
              <CreateFinancialEntrySheet
                action={createAction}
                canCreate={canCreate}
                initialOpen={wantCreate && canCreate}
              />
            ) : null}
          </div>
        }
      />

      <ClientKpiRow
        className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
        items={kpiCards}
      />

      {/* Low-data notice — keep the dashboard looking intentional, not broken,
          when only a few real entries exist. No fake data is added. */}
      {entries.length > 0 && entries.length <= 2 ? (
        <p className="rounded-lg border border-dashed border-accent-gold-muted bg-background-card px-4 py-3 text-xs leading-5 text-foreground-muted">
          Angka di atas dihitung dari{" "}
          <span className="font-medium text-foreground">
            {entries.length} entri nyata
          </span>{" "}
          di database (Supabase). Tren &amp; analitik akan makin kaya seiring
          transaksi bertambah — gunakan{" "}
          <span className="font-medium text-foreground">Catat Transaksi</span>{" "}
          untuk menambah data.
        </p>
      ) : null}

      {/* Insight */}
      <section className="rounded-lg border border-accent-gold-muted bg-accent-gold-muted/20 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
          Financial Insight
        </p>
        <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{insight}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={!canExport} onClick={exportCsv} size="sm" type="button" variant="secondary">
            <Download aria-hidden="true" className="size-4" />
            Export Report
          </Button>
          <Button onClick={() => router.push("/payments")} size="sm" type="button" variant="secondary">
            <ExternalLink aria-hidden="true" className="size-4" />
            Buka Payments
          </Button>
        </div>
      </section>

      {/* Trend + Health */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardCard
          className="xl:col-span-2"
          title="Revenue vs Expense"
          description={`Tren pemasukan & pengeluaran — ${periodLabel}.`}
        >
          <TrendBars buckets={trend} />
        </DashboardCard>

        <DashboardCard
          title="Financial Health Score"
          description="Indikator kesehatan operasional (bukan akuntansi formal)."
        >
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-accent-gold-muted">
              <span className="text-2xl font-semibold text-foreground">
                {kpis.entryCount === 0 ? "—" : health.score}
              </span>
            </div>
            <div>
              <Badge tone={health.tone}>
                {kpis.entryCount === 0 ? "Belum tersedia" : health.label}
              </Badge>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-foreground-muted">
            {(kpis.entryCount === 0
              ? ["Tambahkan financial entry untuk menilai kesehatan keuangan."]
              : health.reasons
            ).map((reason) => (
              <li className="flex items-start gap-1.5" key={reason}>
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-600" />
                {reason}
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      {/* Category performance */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DashboardCard title="Kategori Pemasukan" description="Sumber income terbesar.">
          <CategoryBars
            categories={incomeCats}
            emptyLabel="Belum ada pemasukan pada periode ini."
            tone="income"
          />
        </DashboardCard>
        <DashboardCard title="Kategori Pengeluaran" description="Pengeluaran terbesar.">
          <CategoryBars
            categories={expenseCats}
            emptyLabel="Belum ada pengeluaran pada periode ini."
            tone="expense"
          />
        </DashboardCard>
      </div>

      {/* Entries table */}
      <DashboardCard
        title="Riwayat Transaksi"
        description={`Financial entries — ${periodLabel}.`}
      >
        {periodEntries.length === 0 ? (
          <EmptyState
            title="Belum ada data keuangan pada periode ini."
            description="Tambahkan financial entry atau ubah periode."
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                aria-label="Cari kategori atau catatan"
                className={`${inputClass} w-52`}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kategori / catatan..."
                type="search"
                value={search}
              />
              <select
                aria-label="Tipe"
                className={inputClass}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                value={typeFilter}
              >
                <option value="all">Semua Tipe</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select
                aria-label="Kategori"
                className={inputClass}
                onChange={(e) => setCategoryFilter(e.target.value)}
                value={categoryFilter}
              >
                <option value="all">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <span className="ml-auto text-xs text-foreground-muted">
                {tableEntries.length} dari {periodEntries.length} entri
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-normal text-foreground-muted">
                    <th className="py-2 pr-4 font-medium">Tanggal</th>
                    <th className="py-2 pr-4 font-medium">Tipe</th>
                    <th className="py-2 pr-4 font-medium">Kategori</th>
                    <th className="py-2 pr-4 text-right font-medium">Jumlah</th>
                    <th className="py-2 font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {tableEntries.map((entry) => (
                    <tr className="border-b last:border-0 hover:bg-stone-50/70" key={entry.id}>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-foreground-muted">
                        {formatDateID(entry.occurredOn)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge tone={entry.entryType === "income" ? "success" : "danger"}>
                          {entry.entryType === "income" ? "Income" : "Expense"}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-foreground">
                        {entry.category}
                      </td>
                      <td className="py-2.5 pr-4 text-right whitespace-nowrap tabular-nums text-foreground">
                        {formatCurrencyIDR(entry.amountIdr)}
                      </td>
                      <td className="py-2.5 text-foreground-muted">{entry.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DashboardCard>

      {/* Quick actions */}
      <DashboardCard title="Quick Actions" description="Tindakan finansial cepat.">
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canExport} onClick={exportCsv} size="sm" type="button" variant="secondary">
            <Download aria-hidden="true" className="size-4" /> Export Report
          </Button>
          <Button onClick={() => router.push("/payments")} size="sm" type="button" variant="secondary">
            <Wallet aria-hidden="true" className="size-4" /> Open Payments
          </Button>
          <Button onClick={() => router.push("/settings/audit-logs")} size="sm" type="button" variant="secondary">
            <ScrollText aria-hidden="true" className="size-4" /> View Audit Logs
          </Button>
          <Button onClick={() => router.push("/approvals")} size="sm" type="button" variant="secondary">
            <FileText aria-hidden="true" className="size-4" /> Request Reimbursement Approval
          </Button>
        </div>
      </DashboardCard>
    </div>
  );
}
