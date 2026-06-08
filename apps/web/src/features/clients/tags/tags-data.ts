import {
  CircleCheck,
  Hash,
  Star,
  Tag as TagIcon,
  Users,
} from "lucide-react";

import type { ClientKpi } from "../shared/clients-kpi-card";

// Tag-hygiene metrics — distinct from Segments (campaign) and Management.
export const tagsKpis: ClientKpi[] = [
  {
    icon: TagIcon,
    label: "Total Tags",
    value: "28",
    trend: { tone: "up", label: "3 baru bulan ini" },
    accent: "info",
  },
  {
    icon: CircleCheck,
    label: "Tags Digunakan",
    value: "24",
    helper: "86% dari total tags",
    accent: "success",
  },
  {
    icon: Users,
    label: "Total Client Bertag",
    value: "1.024",
    helper: "82% client punya tags",
    accent: "default",
  },
  {
    icon: Hash,
    label: "Avg Tags per Client",
    value: "2.3",
    trend: { tone: "up", label: "0.4 vs bulan lalu" },
    accent: "warning",
  },
  {
    icon: Star,
    label: "Tag Paling Populer",
    value: "Beginner",
    helper: "312 client · 25%",
    accent: "warning",
  },
];

export type TagType = "System" | "Custom";

export type ClientTag = {
  id: string;
  name: string;
  color: string;
  type: TagType;
  createdBy: string;
  clientCount: number;
  clientPct: string;
  description: string;
  lastUsed: string;
  active: boolean;
};

export const clientTags: ClientTag[] = [
  { id: "t1", name: "Beginner", color: "#3f7cae", type: "System", createdBy: "System", clientCount: 312, clientPct: "25%", description: "Client pemula, baru mulai berlatih", lastUsed: "5 Jun 2025", active: true },
  { id: "t2", name: "At-Risk", color: "#cf4a3a", type: "System", createdBy: "System", clientCount: 186, clientPct: "14.9%", description: "Tidak aktif > 14 hari", lastUsed: "5 Jun 2025", active: true },
  { id: "t3", name: "VIP", color: "#c9a227", type: "System", createdBy: "System", clientCount: 98, clientPct: "7.8%", description: "Top 20% revenue client", lastUsed: "4 Jun 2025", active: true },
  { id: "t4", name: "Prenatal", color: "#a86bb0", type: "System", createdBy: "System", clientCount: 64, clientPct: "5.1%", description: "Kelas khusus ibu hamil", lastUsed: "3 Jun 2025", active: true },
  { id: "t5", name: "Injury Concern", color: "#cf7a3a", type: "Custom", createdBy: "Dinda Pramesti", clientCount: 52, clientPct: "4.2%", description: "Ada catatan cedera / kondisi tertentu", lastUsed: "2 Jun 2025", active: true },
  { id: "t6", name: "Morning Person", color: "#4f8a5b", type: "Custom", createdBy: "Sarah A.", clientCount: 248, clientPct: "19.9%", description: "Suka kelas pagi (sebelum 11:00)", lastUsed: "1 Jun 2025", active: true },
  { id: "t7", name: "Evening Class", color: "#7c6bb0", type: "Custom", createdBy: "Dinda Pramesti", clientCount: 276, clientPct: "22.1%", description: "Suka kelas sore / malam", lastUsed: "1 Jun 2025", active: true },
  { id: "t8", name: "Trial", color: "#3f9bae", type: "System", createdBy: "System", clientCount: 134, clientPct: "10.7%", description: "Client yang masih dalam masa trial", lastUsed: "31 Mei 2025", active: true },
  { id: "t9", name: "Referral", color: "#6b8fb0", type: "Custom", createdBy: "Sarah A.", clientCount: 76, clientPct: "6.1%", description: "Datang dari referral member", lastUsed: "30 Mei 2025", active: true },
  { id: "t10", name: "Price Sensitive", color: "#cf6a8a", type: "Custom", createdBy: "Dinda Pramesti", clientCount: 54, clientPct: "4.3%", description: "Sensitif terhadap harga / promo", lastUsed: "29 Mei 2025", active: false },
];

export const tagOverviewSlices = [
  { label: "Beginner", value: 312, color: "#3f7cae", pct: "25.0%" },
  { label: "Evening Class", value: 276, color: "#7c6bb0", pct: "22.1%" },
  { label: "Morning Person", value: 248, color: "#4f8a5b", pct: "19.9%" },
  { label: "At-Risk", value: 186, color: "#cf4a3a", pct: "14.9%" },
  { label: "Trial", value: 134, color: "#3f9bae", pct: "10.7%" },
  { label: "VIP", value: 98, color: "#c9a227", pct: "7.8%" },
  { label: "Lainnya", value: 120, color: "#cbb9a3", pct: "—" },
];

export const topTagsByClient = [
  { name: "Beginner", count: 312, pct: "25%" },
  { name: "Evening Class", count: 276, pct: "22.1%" },
  { name: "Morning Person", count: 248, pct: "19.9%" },
  { name: "At-Risk", count: 186, pct: "14.9%" },
  { name: "Trial", count: 134, pct: "10.7%" },
  { name: "VIP", count: 98, pct: "7.8%" },
];

// Tag-hygiene insight (NOT the churn/revenue insight used elsewhere).
export const tagsAiInsight =
  "4 tag belum pernah dipakai dan 1 tag nonaktif. Rapikan tag yang tumpang tindih (mis. 'Evening Class' vs 'Morning Person') agar segmentasi lebih akurat.";

export const tagsFilters = [
  { label: "Tipe", options: ["Semua", "System", "Custom"] },
  { label: "Status", options: ["Aktif", "Semua", "Nonaktif"] },
];
