import {
  Crown,
  Hourglass,
  TriangleAlert,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import type { ClientKpi } from "../shared/clients-kpi-card";

export const managementKpis: ClientKpi[] = [
  {
    icon: Users,
    label: "Total Clients",
    value: "1.248",
    trend: { tone: "up", label: "64 bulan ini" },
    accent: "info",
  },
  {
    icon: UserCheck,
    label: "Active Members",
    value: "184",
    trend: { tone: "up", label: "8% vs bulan lalu" },
    accent: "success",
  },
  {
    icon: TriangleAlert,
    label: "At-Risk Clients",
    value: "23",
    trend: { tone: "down", label: "15% vs bulan lalu" },
    accent: "danger",
  },
  {
    icon: Hourglass,
    label: "Expiring Soon (7 hari)",
    value: "17",
    helper: "Potensi Rp 12.750.000",
    accent: "warning",
  },
  {
    icon: UserPlus,
    label: "Trial Belum Convert",
    value: "15",
    helper: "Perlu follow-up",
    accent: "info",
  },
  {
    icon: Crown,
    label: "VIP Clients",
    value: "31",
    helper: "Top 20% revenue",
    accent: "default",
  },
];

// Client-lifecycle insights — kept distinct from Tags (label health) and
// Segments (campaign performance) so nothing repeats across the section.
export const managementInsights = [
  "17 membership akan expired dalam 7 hari (potensi Rp 12.750.000).",
  "23 member tidak datang >14 hari (berisiko churn).",
  "15 trial client belum convert — kirim promo beginner package.",
];

export type ClientStatus = "Active" | "Trial" | "Dormant";

export type ManagedClient = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  status: ClientStatus;
  vip?: boolean;
};

export const managedClients: ManagedClient[] = [
  {
    id: "c1",
    name: "Anita Sari",
    phone: "+62 812 xxx xxx",
    initials: "AS",
    status: "Dormant",
    vip: true,
  },
  {
    id: "c2",
    name: "Kevin Tan",
    phone: "+62 811 xxx xxx",
    initials: "KT",
    status: "Trial",
  },
  {
    id: "c3",
    name: "Maria Lestari",
    phone: "+62 812 xxx xxx",
    initials: "ML",
    status: "Active",
  },
  {
    id: "c5",
    name: "Dewi Kartika",
    phone: "+62 817 xxx xxx",
    initials: "DK",
    status: "Dormant",
  },
  {
    id: "c6",
    name: "Budi Santoso",
    phone: "+62 815 xxx xxx",
    initials: "BS",
    status: "Active",
  },
  {
    id: "c8",
    name: "Raka Pratama",
    phone: "+62 811 xxx xxx",
    initials: "RP",
    status: "Trial",
  },
];

export const managementFilters = [
  { label: "Status", options: ["Semua", "Active", "Trial", "Dormant"] },
];
