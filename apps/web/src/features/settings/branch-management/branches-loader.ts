import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BranchView = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  managerName: string | null;
  phone: string | null;
  email: string | null;
  branchType: "main" | "satellite";
  status: "active" | "inactive" | "archived";
};

type BranchRow = {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  manager_name: string | null;
  phone: string | null;
  email: string | null;
  branch_type: string;
  status: string;
};

// Loads the branch registry from Supabase. Newly created branches appear here
// after revalidation. Returns [] on failure so the page renders an empty state.
export async function loadBranches(): Promise<BranchView[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("branches")
      .select(
        "id, name, city, address, manager_name, phone, email, branch_type, status",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return [];
    }

    return (data as BranchRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      address: row.address,
      managerName: row.manager_name,
      phone: row.phone,
      email: row.email,
      branchType: row.branch_type === "main" ? "main" : "satellite",
      status:
        row.status === "inactive"
          ? "inactive"
          : row.status === "archived"
            ? "archived"
            : "active",
    }));
  } catch {
    return [];
  }
}
