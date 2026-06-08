import "server-only";

import { Layers } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { Segment, SegmentType } from "./segments-data";

type SegmentRow = {
  id: string;
  name: string;
  description: string | null;
  segment_type: string;
  criteria: string[] | null;
  is_active: boolean;
};

const typeMap: Record<string, SegmentType> = {
  system: "System",
  custom: "Custom",
};

// Loads real segments from Supabase and maps them to the rich Segment display
// shape with neutral defaults (campaign/performance metrics are not modeled
// yet). Newly created segments appear here after revalidation.
export async function loadRealSegments(): Promise<Segment[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("client_segments")
      .select("id, name, description, segment_type, criteria, is_active")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data) {
      return [];
    }

    return (data as SegmentRow[]).map(mapSegment);
  } catch {
    return [];
  }
}

function mapSegment(row: SegmentRow): Segment {
  const criteria = Array.isArray(row.criteria) ? row.criteria : [];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "—",
    icon: Layers,
    type: typeMap[row.segment_type] ?? "Custom",
    clientCount: 0,
    clientPct: "—",
    criteriaShort: criteria.slice(0, 2),
    updatedDate: "—",
    updatedBy: "—",
    perfPrimaryLabel: "Anggota",
    perfPrimaryValue: "0",
    perfRevenue: "Rp 0",
    createdDate: "—",
    createdBy: "—",
    criteriaFull: criteria,
    perfSecondaryLabel: "—",
    perfSecondaryValue: "0",
    openRate: "—",
    clickRate: "—",
    aiInsight: "Lengkapi data segment untuk insight kampanye personal.",
  };
}
