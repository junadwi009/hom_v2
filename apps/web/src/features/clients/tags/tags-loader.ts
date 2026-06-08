import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { ClientTag, TagType } from "./tags-data";

type TagRow = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  tag_type: string;
  is_active: boolean;
};

const typeMap: Record<string, TagType> = {
  system: "System",
  custom: "Custom",
};

// Loads real tags from Supabase and maps them to the rich ClientTag display
// shape with neutral defaults (usage metrics are not modeled yet). Newly
// created tags appear here after revalidation.
export async function loadRealTags(): Promise<ClientTag[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("client_tags")
      .select("id, name, color, description, tag_type, is_active")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data) {
      return [];
    }

    return (data as TagRow[]).map(mapTag);
  } catch {
    return [];
  }
}

function mapTag(row: TagRow): ClientTag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    type: typeMap[row.tag_type] ?? "Custom",
    createdBy: "—",
    clientCount: 0,
    clientPct: "—",
    description: row.description ?? "—",
    lastUsed: "—",
    active: row.is_active,
  };
}
