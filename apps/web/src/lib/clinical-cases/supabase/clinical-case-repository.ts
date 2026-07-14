import "server-only";

import {
  clientClinicalCaseSchema,
  type ClientClinicalCase,
} from "@hom/domain/clinical-cases";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const CLINICAL_CASE_SELECT =
  "id,client_id,title,case_status,severity,summary,opened_on";

type ClinicalCaseRow = {
  id: string;
  client_id: string;
  title: string;
  case_status: string;
  severity: string;
  summary: string | null;
  opened_on: string;
};

type ClinicalCaseQueryBuilder = {
  select: (columns: string) => ClinicalCaseQueryBuilder;
  eq: (column: string, value: string) => ClinicalCaseQueryBuilder;
  order: (
    column: string,
    options: { ascending: boolean },
  ) => PromiseLike<{ data: ClinicalCaseRow[] | null; error: unknown }>;
};

export type ClinicalCaseQueryClient = {
  from: (table: "clinical_cases") => ClinicalCaseQueryBuilder;
};

function mapClinicalCaseRow(row: ClinicalCaseRow): ClientClinicalCase {
  return clientClinicalCaseSchema.parse({
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    caseStatus: row.case_status,
    severity: row.severity,
    summary: row.summary,
    openedOn: row.opened_on,
  });
}

export async function listClinicalCasesByClient(
  clientId: string,
  options?: { client?: ClinicalCaseQueryClient },
): Promise<ClientClinicalCase[]> {
  try {
    const supabase =
      options?.client ??
      ((await createSupabaseServerClient()) as unknown as ClinicalCaseQueryClient);

    const response = await supabase
      .from("clinical_cases")
      .select(CLINICAL_CASE_SELECT)
      .eq("client_id", clientId)
      .order("opened_on", { ascending: false });

    if (response.error || !response.data) {
      return [];
    }

    return response.data.map(mapClinicalCaseRow);
  } catch {
    return [];
  }
}
