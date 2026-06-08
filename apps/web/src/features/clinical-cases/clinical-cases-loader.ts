import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ClinicalCaseView = {
  id: string;
  clientName: string;
  title: string;
  caseStatus: "open" | "monitoring" | "resolved";
  severity: "low" | "medium" | "high";
  summary: string | null;
  openedOn: string;
};

export type ClientOption = {
  id: string;
  name: string;
};

export type ClinicalCasesData = {
  cases: ClinicalCaseView[];
  clients: ClientOption[];
};

type ClinicalCaseRow = {
  id: string;
  client_id: string;
  title: string;
  case_status: string;
  severity: string;
  summary: string | null;
  opened_on: string;
};

type ClientRow = {
  id: string;
  full_name: string;
};

const statusValues: ClinicalCaseView["caseStatus"][] = [
  "open",
  "monitoring",
  "resolved",
];
const severityValues: ClinicalCaseView["severity"][] = [
  "low",
  "medium",
  "high",
];

// Loads clinical cases joined with client names (for the table) plus the client
// option list (for the create form select). Returns empty collections on
// failure so the restricted registry page can render gracefully.
export async function loadClinicalCasesData(): Promise<ClinicalCasesData> {
  try {
    const supabase = await createSupabaseServerClient();

    const [casesResult, clientsResult] = await Promise.all([
      supabase
        .from("clinical_cases")
        .select("id, client_id, title, case_status, severity, summary, opened_on")
        .order("opened_on", { ascending: false })
        .limit(50),
      supabase
        .from("clients")
        .select("id, full_name")
        .order("full_name", { ascending: true })
        .limit(200),
    ]);

    const clientRows = (clientsResult.data as ClientRow[]) ?? [];
    const nameById = new Map(clientRows.map((row) => [row.id, row.full_name]));

    const cases = ((casesResult.data as ClinicalCaseRow[]) ?? []).map((row) => ({
      id: row.id,
      clientName: nameById.get(row.client_id) ?? "—",
      title: row.title,
      caseStatus: statusValues.includes(
        row.case_status as ClinicalCaseView["caseStatus"],
      )
        ? (row.case_status as ClinicalCaseView["caseStatus"])
        : "open",
      severity: severityValues.includes(row.severity as ClinicalCaseView["severity"])
        ? (row.severity as ClinicalCaseView["severity"])
        : "low",
      summary: row.summary,
      openedOn: row.opened_on,
    }));

    return {
      cases,
      clients: clientRows.map((row) => ({ id: row.id, name: row.full_name })),
    };
  } catch {
    return { cases: [], clients: [] };
  }
}
