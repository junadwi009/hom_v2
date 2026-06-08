import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FinancialEntryView = {
  id: string;
  entryType: "income" | "expense";
  category: string;
  amountIdr: number;
  occurredOn: string;
  note: string | null;
};

type FinancialEntryRow = {
  id: string;
  entry_type: string;
  category: string;
  amount_idr: number;
  occurred_on: string;
  note: string | null;
};

// Loads real financial ledger entries from Supabase. Newly created entries
// appear here after revalidation. Returns [] on any failure so the page can
// render an empty state rather than crashing.
export async function loadFinancialEntries(): Promise<FinancialEntryView[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("financial_entries")
      .select("id, entry_type, category, amount_idr, occurred_on, note")
      .order("occurred_on", { ascending: false })
      .limit(365);

    if (error || !data) {
      return [];
    }

    return (data as FinancialEntryRow[]).map((row) => ({
      id: row.id,
      entryType: row.entry_type === "income" ? "income" : "expense",
      category: row.category,
      amountIdr: row.amount_idr,
      occurredOn: row.occurred_on,
      note: row.note,
    }));
  } catch {
    return [];
  }
}
