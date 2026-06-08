import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { Lead, LeadSource, LeadStage, LeadStatus } from "./leads-data";

type LeadRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: string;
  stage: string;
  status: string;
  score: number;
  interest: string | null;
  branch: string | null;
  note: string | null;
};

const sourceMap: Record<string, LeadSource> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  google: "Google",
  referral: "Referral",
  walk_in: "Walk-in",
  facebook_ads: "Facebook Ads",
};

const stageMap: Record<string, LeadStage> = {
  new_lead: "New Lead",
  trial_booked: "Trial Booked",
  trial_attended: "Trial Attended",
  member_converted: "Member Converted",
};

const statusMap: Record<string, LeadStatus> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

// Loads real leads from Supabase and maps them to the rich Lead display shape
// with neutral defaults (assignment/AI fields are not modeled yet). Newly
// created leads appear here after revalidation, proving the create pipeline
// persists.
export async function loadRealLeads(): Promise<Lead[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("leads")
      .select(
        "id, full_name, phone, email, source, stage, status, score, interest, branch, note",
      )
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data) {
      return [];
    }

    return (data as LeadRow[]).map(mapLead);
  } catch {
    return [];
  }
}

function mapLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.full_name,
    phone: row.phone ?? "—",
    initials: toInitials(row.full_name),
    source: sourceMap[row.source] ?? "Instagram",
    stage: stageMap[row.stage] ?? "New Lead",
    status: statusMap[row.status] ?? "Warm",
    lastContact: "—",
    nextAction: "Tindak lanjut lead",
    nextActionVia: "—",
    assignedTo: "Belum ditugaskan",
    assignedInitials: "?",
    score: row.score,
    joinedDate: "—",
    email: row.email ?? "—",
    interest: row.interest ?? "Belum spesifik",
    branch: row.branch ?? "—",
    note: row.note ?? "—",
    nextBestAction: "Lengkapi data lead untuk rekomendasi personal.",
    potentialPackage: "—",
    potentialRevenue: "Rp 0",
  };
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}
