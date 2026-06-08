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

export type ClientStatus =
  | "Active"
  | "At-Risk"
  | "Trial"
  | "Expiring Soon"
  | "Dormant";
export type RiskLevel = "High" | "Medium" | "Low";

export type ManagedClient = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  status: ClientStatus;
  vip?: boolean;
  membershipName: string;
  membershipDetail: string;
  lastVisit: string;
  nextBooking: string | null;
  riskLevel: RiskLevel;
  totalSpend: string;
  healthScore: number;
  riskReasons: string[];
  membership: {
    name: string;
    startLabel: string;
    expiryLabel: string;
    used: number;
    total: number;
    unit: string;
    active: boolean;
  };
  activity: { lastVisit: string; lastClass: string; totalVisit: string };
  spend: { total: string; perMonth: string; lastPayment: string };
  aiRecommendation: string;
};

export const managedClients: ManagedClient[] = [
  {
    id: "c1",
    name: "Anita Sari",
    phone: "+62 812 xxx xxx",
    initials: "AS",
    status: "At-Risk",
    vip: true,
    membershipName: "Monthly Unlimited",
    membershipDetail: "Exp: 15 Jun 2025",
    lastVisit: "21 hari lalu",
    nextBooking: null,
    riskLevel: "High",
    totalSpend: "Rp 6.250.000",
    healthScore: 42,
    riskReasons: [
      "Tidak datang > 14 hari",
      "Membership hampir expired (5 hari)",
      "Tidak ada booking berikutnya",
    ],
    membership: {
      name: "Monthly Unlimited",
      startLabel: "Mulai 16 Mei 2025",
      expiryLabel: "Expires 15 Jun 2025 (5 hari lagi)",
      used: 5,
      total: 30,
      unit: "hari",
      active: true,
    },
    activity: {
      lastVisit: "21 hari lalu (16 Mei 2025)",
      lastClass: "Vinyasa Flow (17:00) — Raka",
      totalVisit: "28 kali",
    },
    spend: {
      total: "Rp 6.250.000",
      perMonth: "Rp 625.000",
      lastPayment: "10 Mei 2025",
    },
    aiRecommendation:
      "Anita biasanya konsisten di kelas Vinyasa sore hari. Kirim reminder personal + tawarkan promo renewal. Potensi revenue: Rp 650.000.",
  },
  {
    id: "c2",
    name: "Kevin Tan",
    phone: "+62 811 xxx xxx",
    initials: "KT",
    status: "Trial",
    membershipName: "Trial Class",
    membershipDetail: "(Attended)",
    lastVisit: "5 hari lalu",
    nextBooking: null,
    riskLevel: "Medium",
    totalSpend: "Rp 0",
    healthScore: 58,
    riskReasons: ["Trial attended, belum ambil paket", "Belum ada booking lanjutan"],
    membership: {
      name: "Trial Class",
      startLabel: "Trial 1 Jun 2025",
      expiryLabel: "Belum konversi",
      used: 1,
      total: 1,
      unit: "sesi",
      active: false,
    },
    activity: {
      lastVisit: "5 hari lalu",
      lastClass: "Mat Pilates (10:00) — Dinda",
      totalVisit: "1 kali",
    },
    spend: { total: "Rp 0", perMonth: "Rp 0", lastPayment: "—" },
    aiRecommendation:
      "Kevin sudah trial attended. Tawarkan beginner package (Rp 199.000) dalam 48 jam untuk konversi optimal.",
  },
  {
    id: "c3",
    name: "Maria Lestari",
    phone: "+62 812 xxx xxx",
    initials: "ML",
    status: "Active",
    membershipName: "10 Class Pack",
    membershipDetail: "Sisa 4 dari 10",
    lastVisit: "Kemarin",
    nextBooking: "Sat, 10:00 · Vinyasa Flow",
    riskLevel: "Low",
    totalSpend: "Rp 1.800.000",
    healthScore: 81,
    riskReasons: ["Aktif & rutin", "Paket masih tersisa"],
    membership: {
      name: "10 Class Pack",
      startLabel: "Mulai 1 Mei 2025",
      expiryLabel: "Sisa 4 sesi",
      used: 6,
      total: 10,
      unit: "sesi",
      active: true,
    },
    activity: {
      lastVisit: "Kemarin",
      lastClass: "Vinyasa Flow (10:00) — Raka",
      totalVisit: "34 kali",
    },
    spend: {
      total: "Rp 1.800.000",
      perMonth: "Rp 450.000",
      lastPayment: "1 Mei 2025",
    },
    aiRecommendation:
      "Maria rutin & paket hampir habis. Tawarkan upgrade ke Monthly Unlimited untuk retensi jangka panjang.",
  },
  {
    id: "c4",
    name: "Rina Putri",
    phone: "+62 813 xxx xxx",
    initials: "RP",
    status: "Expiring Soon",
    membershipName: "Monthly Unlimited",
    membershipDetail: "Exp: 8 Jun 2025",
    lastVisit: "Hari ini",
    nextBooking: "Fri, 18:00 · Pilates Core",
    riskLevel: "Medium",
    totalSpend: "Rp 5.450.000",
    healthScore: 67,
    riskReasons: ["Membership expired dalam 2 hari", "Masih aktif berlatih"],
    membership: {
      name: "Monthly Unlimited",
      startLabel: "Mulai 9 Mei 2025",
      expiryLabel: "Expires 8 Jun 2025 (2 hari lagi)",
      used: 28,
      total: 30,
      unit: "hari",
      active: true,
    },
    activity: {
      lastVisit: "Hari ini",
      lastClass: "Pilates Core (18:00) — Maya",
      totalVisit: "41 kali",
    },
    spend: {
      total: "Rp 5.450.000",
      perMonth: "Rp 545.000",
      lastPayment: "9 Mei 2025",
    },
    aiRecommendation:
      "Rina masih sangat aktif tapi membership hampir habis. Kirim auto-renewal sekarang — konversi sangat tinggi.",
  },
  {
    id: "c5",
    name: "Dewi Kartika",
    phone: "+62 817 xxx xxx",
    initials: "DK",
    status: "Dormant",
    membershipName: "5 Class Pack",
    membershipDetail: "Sisa 5 dari 5",
    lastVisit: "45 hari lalu",
    nextBooking: null,
    riskLevel: "High",
    totalSpend: "Rp 650.000",
    healthScore: 28,
    riskReasons: [
      "Tidak datang > 30 hari",
      "Paket belum dipakai sama sekali",
      "Tidak ada booking",
    ],
    membership: {
      name: "5 Class Pack",
      startLabel: "Mulai 20 Apr 2025",
      expiryLabel: "Belum terpakai",
      used: 0,
      total: 5,
      unit: "sesi",
      active: false,
    },
    activity: {
      lastVisit: "45 hari lalu",
      lastClass: "—",
      totalVisit: "0 kali",
    },
    spend: {
      total: "Rp 650.000",
      perMonth: "—",
      lastPayment: "20 Apr 2025",
    },
    aiRecommendation:
      "Dewi beli paket tapi belum pernah datang. Kirim onboarding + jadwalkan kelas pertama untuk re-aktivasi.",
  },
  {
    id: "c6",
    name: "Budi Santoso",
    phone: "+62 815 xxx xxx",
    initials: "BS",
    status: "Active",
    membershipName: "Monthly Unlimited",
    membershipDetail: "Exp: 20 Jun 2025",
    lastVisit: "2 hari lalu",
    nextBooking: "Sun, 08:00 · Hatha Basic",
    riskLevel: "Low",
    totalSpend: "Rp 7.200.000",
    healthScore: 88,
    riskReasons: ["Sangat aktif", "Membership aman"],
    membership: {
      name: "Monthly Unlimited",
      startLabel: "Mulai 21 Mei 2025",
      expiryLabel: "Expires 20 Jun 2025",
      used: 16,
      total: 30,
      unit: "hari",
      active: true,
    },
    activity: {
      lastVisit: "2 hari lalu",
      lastClass: "Hatha Basic (08:00) — Dinda",
      totalVisit: "62 kali",
    },
    spend: {
      total: "Rp 7.200.000",
      perMonth: "Rp 720.000",
      lastPayment: "21 Mei 2025",
    },
    aiRecommendation:
      "Budi loyal & high value. Pertimbangkan referral program — peluang membawa member baru tinggi.",
  },
  {
    id: "c7",
    name: "Sari Wulandari",
    phone: "+62 818 xxx xxx",
    initials: "SW",
    status: "At-Risk",
    membershipName: "Class Pack 10",
    membershipDetail: "Sisa 2 dari 10",
    lastVisit: "16 hari lalu",
    nextBooking: null,
    riskLevel: "Medium",
    totalSpend: "Rp 1.250.000",
    healthScore: 49,
    riskReasons: ["Tidak datang > 14 hari", "Paket hampir habis", "Tidak ada booking"],
    membership: {
      name: "Class Pack 10",
      startLabel: "Mulai 5 Mei 2025",
      expiryLabel: "Sisa 2 sesi",
      used: 8,
      total: 10,
      unit: "sesi",
      active: true,
    },
    activity: {
      lastVisit: "16 hari lalu",
      lastClass: "Mat Pilates (19:00) — Maya",
      totalVisit: "18 kali",
    },
    spend: {
      total: "Rp 1.250.000",
      perMonth: "Rp 312.000",
      lastPayment: "5 Mei 2025",
    },
    aiRecommendation:
      "Sari mulai jarang datang & paket hampir habis. Kirim reminder + promo refill paket sekarang.",
  },
  {
    id: "c8",
    name: "Raka Pratama",
    phone: "+62 811 xxx xxx",
    initials: "RP",
    status: "Trial",
    membershipName: "Trial Class",
    membershipDetail: "(No Show)",
    lastVisit: "10 hari lalu",
    nextBooking: null,
    riskLevel: "High",
    totalSpend: "Rp 0",
    healthScore: 22,
    riskReasons: ["Trial no-show", "Belum pernah hadir", "Belum ada follow-up"],
    membership: {
      name: "Trial Class",
      startLabel: "Booking 27 Mei 2025",
      expiryLabel: "No show",
      used: 0,
      total: 1,
      unit: "sesi",
      active: false,
    },
    activity: {
      lastVisit: "10 hari lalu (booking)",
      lastClass: "—",
      totalVisit: "0 kali",
    },
    spend: { total: "Rp 0", perMonth: "Rp 0", lastPayment: "—" },
    aiRecommendation:
      "Raka no-show saat trial. Hubungi via WhatsApp untuk reschedule + jelaskan benefit kelas pertama.",
  },
];

export const managementFilters = [
  { label: "Status", options: ["Semua", "Active", "At-Risk", "Trial", "Expiring Soon", "Dormant"] },
  { label: "Membership", options: ["Semua", "Monthly Unlimited", "Class Pack", "Trial"] },
  { label: "Last Visit", options: ["Semua", "< 7 hari", "7-14 hari", "> 14 hari"] },
  { label: "Risk Level", options: ["Semua", "High", "Medium", "Low"] },
  { label: "Tag", options: ["Semua", "Beginner", "VIP", "At-Risk"] },
];
