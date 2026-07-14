import { formatCompactIDR } from "@/lib/format";

import type { FinancialEntryView } from "./financials-loader";

export type FinancialPeriod =
  | "this_month"
  | "last_30_days"
  | "last_month"
  | "this_year";

export const FINANCIAL_PERIODS: { value: FinancialPeriod; label: string }[] = [
  { value: "this_month", label: "Bulan ini" },
  { value: "last_30_days", label: "30 hari terakhir" },
  { value: "last_month", label: "Bulan lalu" },
  { value: "this_year", label: "Tahun ini" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// Parse a "YYYY-MM-DD" (or ISO) occurredOn into a UTC Date.
function parseDate(value: string): Date {
  const time = Date.parse(value);
  return new Date(Number.isNaN(time) ? Date.now() : time);
}

// Reference "today" for period math = the REAL current date, so "Bulan ini"
// means the actual current calendar month. (It previously used the latest
// entry date to be demo-friendly, but that made "revenue this month" disagree
// with the Overview/Catalog figures, which are anchored to the real clock.)
function referenceDate(): Date {
  return new Date();
}

export function filterByPeriod(
  entries: FinancialEntryView[],
  period: FinancialPeriod,
): FinancialEntryView[] {
  const ref = referenceDate();
  const refY = ref.getUTCFullYear();
  const refM = ref.getUTCMonth();

  return entries.filter((entry) => {
    const d = parseDate(entry.occurredOn);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    switch (period) {
      case "this_month":
        return y === refY && m === refM;
      case "last_month": {
        const lm = refM === 0 ? 11 : refM - 1;
        const ly = refM === 0 ? refY - 1 : refY;
        return y === ly && m === lm;
      }
      case "last_30_days":
        return ref.getTime() - d.getTime() <= 30 * DAY_MS && d.getTime() <= ref.getTime();
      case "this_year":
        return y === refY;
      default:
        return true;
    }
  });
}

export type CategoryTotal = {
  category: string;
  amount: number;
  share: number; // 0..1 of the type total
};

export function categoryTotals(
  entries: FinancialEntryView[],
  type: "income" | "expense",
): CategoryTotal[] {
  const byCat = new Map<string, number>();
  let total = 0;
  for (const entry of entries) {
    if (entry.entryType !== type) continue;
    byCat.set(entry.category, (byCat.get(entry.category) ?? 0) + entry.amountIdr);
    total += entry.amountIdr;
  }
  return [...byCat.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      share: total > 0 ? amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export type FinancialKpis = {
  income: number;
  expense: number;
  net: number;
  incomeCount: number;
  expenseCount: number;
  entryCount: number;
  largestIncome: CategoryTotal | null;
  largestExpense: CategoryTotal | null;
};

export function computeFinancialKpis(
  entries: FinancialEntryView[],
): FinancialKpis {
  const income = entries
    .filter((e) => e.entryType === "income")
    .reduce((s, e) => s + e.amountIdr, 0);
  const expense = entries
    .filter((e) => e.entryType === "expense")
    .reduce((s, e) => s + e.amountIdr, 0);
  const incomeCats = categoryTotals(entries, "income");
  const expenseCats = categoryTotals(entries, "expense");
  return {
    income,
    expense,
    net: income - expense,
    incomeCount: entries.filter((e) => e.entryType === "income").length,
    expenseCount: entries.filter((e) => e.entryType === "expense").length,
    entryCount: entries.length,
    largestIncome: incomeCats[0] ?? null,
    largestExpense: expenseCats[0] ?? null,
  };
}

export type TrendBucket = {
  label: string;
  income: number;
  expense: number;
  net: number;
};

const ID_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// Buckets entries for the trend chart: monthly for "this_year", weekly otherwise.
export function trendBuckets(
  entries: FinancialEntryView[],
  period: FinancialPeriod,
): TrendBucket[] {
  if (entries.length === 0) return [];
  const monthly = period === "this_year";
  const buckets = new Map<number, TrendBucket>();

  for (const entry of entries) {
    const d = parseDate(entry.occurredOn);
    const key = monthly
      ? d.getUTCFullYear() * 12 + d.getUTCMonth()
      : Math.floor(d.getTime() / (7 * DAY_MS));
    let bucket = buckets.get(key);
    if (!bucket) {
      const label = monthly
        ? ID_MONTHS[d.getUTCMonth()]
        : `${d.getUTCDate()} ${ID_MONTHS[d.getUTCMonth()]}`;
      bucket = { label, income: 0, expense: 0, net: 0 };
      buckets.set(key, bucket);
    }
    if (entry.entryType === "income") bucket.income += entry.amountIdr;
    else bucket.expense += entry.amountIdr;
    bucket.net = bucket.income - bucket.expense;
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-8)
    .map(([, bucket]) => bucket);
}

export type FinancialHealth = {
  score: number;
  label: "Sehat" | "Stabil" | "Perlu Perhatian" | "Risiko Tinggi";
  tone: "success" | "info" | "warning" | "danger";
  reasons: string[];
};

// Rule-based operational financial health (NOT formal accounting).
export function calculateFinancialHealthScore(
  kpis: FinancialKpis,
): FinancialHealth {
  const reasons: string[] = [];
  let score = 100;

  const expenseRatio =
    kpis.income > 0 ? kpis.expense / kpis.income : kpis.expense > 0 ? 2 : 0;

  if (kpis.net < 0) {
    score -= 35;
    reasons.push("Cashflow negatif — pengeluaran melebihi pemasukan.");
  } else if (expenseRatio > 0.85) {
    score -= 20;
    reasons.push("Rasio pengeluaran tinggi (>85% dari pemasukan).");
  } else {
    reasons.push("Cashflow positif dengan margin yang sehat.");
  }

  if (kpis.largestExpense && kpis.largestExpense.share > 0.5) {
    score -= 15;
    reasons.push(
      `Pengeluaran terkonsentrasi di "${kpis.largestExpense.category}" (>50%).`,
    );
  }

  if (kpis.income === 0 && kpis.expense > 0) {
    score = Math.min(score, 25);
    reasons.push("Belum ada pemasukan tercatat pada periode ini.");
  }

  score = Math.max(0, Math.min(100, score));

  const { label, tone } =
    score >= 80
      ? { label: "Sehat" as const, tone: "success" as const }
      : score >= 60
        ? { label: "Stabil" as const, tone: "info" as const }
        : score >= 40
          ? { label: "Perlu Perhatian" as const, tone: "warning" as const }
          : { label: "Risiko Tinggi" as const, tone: "danger" as const };

  return { score, label, tone, reasons };
}

// Rule-based insight sentence (no LLM).
export function generateFinancialInsight(kpis: FinancialKpis): string {
  if (kpis.entryCount === 0) {
    return "Belum ada data keuangan pada periode ini. Tambahkan financial entry untuk mulai memantau cashflow.";
  }
  const parts: string[] = [];
  if (kpis.net >= 0) {
    parts.push(
      `Pemasukan ${formatCompactIDR(kpis.income)} lebih besar dari pengeluaran ${formatCompactIDR(kpis.expense)} (net ${formatCompactIDR(kpis.net)}).`,
    );
  } else {
    parts.push(
      `Pengeluaran ${formatCompactIDR(kpis.expense)} melebihi pemasukan ${formatCompactIDR(kpis.income)} — cashflow defisit ${formatCompactIDR(kpis.net)}.`,
    );
  }
  if (kpis.largestExpense) {
    parts.push(
      `Kategori pengeluaran terbesar adalah ${kpis.largestExpense.category} (${Math.round(kpis.largestExpense.share * 100)}%). Perhatikan cashflow jika tren ini berlanjut.`,
    );
  }
  return parts.join(" ");
}
