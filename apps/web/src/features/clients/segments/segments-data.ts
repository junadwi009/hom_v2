import {
  CircleDollarSign,
  Crown,
  Heart,
  Hourglass,
  Layers,
  MoonStar,
  Send,
  Sprout,
  Star,
  Sunrise,
  TriangleAlert,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { ClientKpi } from "../shared/clients-kpi-card";

// Campaign + segmentation metrics — deliberately different from Tags (label
// metrics) and Client Management (lifecycle counts).
export const segmentsKpis: ClientKpi[] = [
  {
    icon: Layers,
    label: "Total Segment",
    value: "12",
    trend: { tone: "up", label: "2 baru bulan ini" },
    accent: "info",
  },
  {
    icon: Users,
    label: "Client di Segment",
    value: "1.248",
    trend: { tone: "up", label: "8% vs bulan lalu" },
    accent: "default",
  },
  {
    icon: Send,
    label: "Campaign Terkirim (Bulan Ini)",
    value: "23",
    helper: "Open Rate 68%",
    accent: "info",
  },
  {
    icon: CircleDollarSign,
    label: "Revenue dari Campaign",
    value: "Rp 24.750.000",
    helper: "Dari 6 campaign berhasil",
    trend: { tone: "up", label: "18% vs bulan lalu" },
    accent: "success",
  },
  {
    icon: Star,
    label: "Segment Terbaik",
    value: "At-Risk",
    helper: "14 Hari · Revenue Rp 8.450.000",
    accent: "warning",
  },
];

export type SegmentType = "System" | "Custom";

export type Segment = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  type: SegmentType;
  clientCount: number;
  clientPct: string;
  criteriaShort: string[];
  updatedDate: string;
  updatedBy: string;
  perfPrimaryLabel: string;
  perfPrimaryValue: string;
  perfRevenue: string;
  createdDate: string;
  createdBy: string;
  criteriaFull: string[];
  perfSecondaryLabel: string;
  perfSecondaryValue: string;
  openRate: string;
  clickRate: string;
  aiInsight: string;
};

export const segments: Segment[] = [
  {
    id: "s1",
    name: "At-Risk (14 Hari)",
    description: "Client tidak datang > 14 hari",
    icon: TriangleAlert,
    type: "System",
    clientCount: 23,
    clientPct: "1.8%",
    criteriaShort: ["Last visit > 14 hari", "Active member"],
    updatedDate: "5 Jun 2025",
    updatedBy: "Dinda",
    perfPrimaryLabel: "Renewed",
    perfPrimaryValue: "7",
    perfRevenue: "Rp 8.450.000",
    createdDate: "15 Apr 2025",
    createdBy: "System",
    criteriaFull: [
      "Last visit lebih dari 14 hari",
      "Status membership aktif",
      "Tidak ada booking dalam 14 hari ke depan",
      "Total visit historis > 5 kali",
    ],
    perfSecondaryLabel: "Belum Aktif",
    perfSecondaryValue: "16",
    openRate: "72%",
    clickRate: "28%",
    aiInsight:
      "23 member berisiko churn. Kirim reminder personal dan tawarkan kelas favorit mereka.",
  },
  {
    id: "s2",
    name: "Expiring Soon (7 Hari)",
    description: "Membership akan expired",
    icon: Hourglass,
    type: "System",
    clientCount: 17,
    clientPct: "1.4%",
    criteriaShort: ["Expires in <= 7 hari", "Status = Active"],
    updatedDate: "5 Jun 2025",
    updatedBy: "Dinda",
    perfPrimaryLabel: "Renewed",
    perfPrimaryValue: "5",
    perfRevenue: "Rp 6.300.000",
    createdDate: "15 Apr 2025",
    createdBy: "System",
    criteriaFull: [
      "Membership expires dalam 7 hari",
      "Status membership aktif",
      "Auto-renew tidak aktif",
    ],
    perfSecondaryLabel: "Belum Renew",
    perfSecondaryValue: "12",
    openRate: "70%",
    clickRate: "26%",
    aiInsight:
      "17 membership hampir habis. Kirim penawaran auto-renew dengan insentif first-month.",
  },
  {
    id: "s3",
    name: "Trial Belum Convert",
    description: "Trial attended tapi belum beli",
    icon: UserPlus,
    type: "System",
    clientCount: 15,
    clientPct: "1.2%",
    criteriaShort: ["Trial attended", "No package purchased"],
    updatedDate: "4 Jun 2025",
    updatedBy: "Dinda",
    perfPrimaryLabel: "Converted",
    perfPrimaryValue: "4",
    perfRevenue: "Rp 3.600.000",
    createdDate: "15 Apr 2025",
    createdBy: "System",
    criteriaFull: [
      "Trial sudah attended",
      "Belum membeli paket apapun",
      "Trial dalam 14 hari terakhir",
    ],
    perfSecondaryLabel: "Belum Convert",
    perfSecondaryValue: "11",
    openRate: "65%",
    clickRate: "24%",
    aiInsight:
      "15 trial belum convert. Kirim promo beginner package terbatas waktu untuk dorong keputusan.",
  },
  {
    id: "s4",
    name: "VIP / High Value",
    description: "Top 20% revenue client",
    icon: Crown,
    type: "System",
    clientCount: 31,
    clientPct: "2.5%",
    criteriaShort: ["Total spend top 20%", "Active member"],
    updatedDate: "3 Jun 2025",
    updatedBy: "Dinda",
    perfPrimaryLabel: "Retention",
    perfPrimaryValue: "87%",
    perfRevenue: "Rp 7.250.000",
    createdDate: "15 Apr 2025",
    createdBy: "System",
    criteriaFull: [
      "Total spend masuk top 20%",
      "Status membership aktif",
      "Tenure > 3 bulan",
    ],
    perfSecondaryLabel: "Aktif",
    perfSecondaryValue: "27",
    openRate: "81%",
    clickRate: "34%",
    aiInsight:
      "Segment VIP punya retensi tinggi. Tawarkan benefit eksklusif & referral untuk menambah LTV.",
  },
  {
    id: "s5",
    name: "Loyal Members",
    description: "Sering datang dan aktif",
    icon: Heart,
    type: "Custom",
    clientCount: 86,
    clientPct: "6.9%",
    criteriaShort: ["Visit frequency >= 8 / 30 hari", "Attendance rate >= 70%"],
    updatedDate: "2 Jun 2025",
    updatedBy: "Sarah",
    perfPrimaryLabel: "Retention",
    perfPrimaryValue: "92%",
    perfRevenue: "Rp 4.820.000",
    createdDate: "20 Apr 2025",
    createdBy: "Sarah A.",
    criteriaFull: [
      "Visit frequency >= 8 per 30 hari",
      "Attendance rate >= 70%",
      "Membership aktif",
    ],
    perfSecondaryLabel: "Aktif",
    perfSecondaryValue: "82",
    openRate: "78%",
    clickRate: "31%",
    aiInsight:
      "Member loyal cocok untuk program ambassador. Ajak ikut kelas baru & beri reward loyalitas.",
  },
  {
    id: "s6",
    name: "Morning People",
    description: "Suka kelas pagi",
    icon: Sunrise,
    type: "Custom",
    clientCount: 44,
    clientPct: "3.5%",
    criteriaShort: ["Prefer time 05:00 - 11:00", "Total visit >= 5"],
    updatedDate: "30 Mei 2025",
    updatedBy: "Sarah",
    perfPrimaryLabel: "Engagement",
    perfPrimaryValue: "68%",
    perfRevenue: "Rp 2.140.000",
    createdDate: "22 Apr 2025",
    createdBy: "Sarah A.",
    criteriaFull: [
      "Mayoritas booking jam 05:00 - 11:00",
      "Total visit >= 5 kali",
    ],
    perfSecondaryLabel: "Aktif",
    perfSecondaryValue: "40",
    openRate: "70%",
    clickRate: "22%",
    aiInsight:
      "Promosikan kelas pagi baru ke segment ini — engagement & response paling cocok di pagi hari.",
  },
  {
    id: "s7",
    name: "Beginner",
    description: "Client pemula",
    icon: Sprout,
    type: "Custom",
    clientCount: 62,
    clientPct: "5.0%",
    criteriaShort: ["First visit <= 60 hari", "Class level = Beginner"],
    updatedDate: "30 Mei 2025",
    updatedBy: "Sarah",
    perfPrimaryLabel: "Converted",
    perfPrimaryValue: "9",
    perfRevenue: "Rp 4.050.000",
    createdDate: "22 Apr 2025",
    createdBy: "Sarah A.",
    criteriaFull: [
      "First visit <= 60 hari",
      "Mayoritas ikut kelas level Beginner",
    ],
    perfSecondaryLabel: "Onboarding",
    perfSecondaryValue: "53",
    openRate: "67%",
    clickRate: "25%",
    aiInsight:
      "Beginner butuh nurturing. Kirim seri edukasi & tawarkan paket lanjutan setelah 4 kelas.",
  },
  {
    id: "s8",
    name: "Dormant (30 Hari+)",
    description: "Tidak aktif lebih dari 30 hari",
    icon: MoonStar,
    type: "System",
    clientCount: 78,
    clientPct: "6.3%",
    criteriaShort: ["Last visit > 30 hari", "No upcoming booking"],
    updatedDate: "29 Mei 2025",
    updatedBy: "Dinda",
    perfPrimaryLabel: "Reactivated",
    perfPrimaryValue: "6",
    perfRevenue: "Rp 2.130.000",
    createdDate: "15 Apr 2025",
    createdBy: "System",
    criteriaFull: [
      "Last visit lebih dari 30 hari",
      "Tidak ada booking yang akan datang",
      "Pernah jadi member aktif",
    ],
    perfSecondaryLabel: "Belum Aktif",
    perfSecondaryValue: "72",
    openRate: "58%",
    clickRate: "18%",
    aiInsight:
      "Segment dormant butuh win-back. Tawarkan promo come-back + kelas favorit lama mereka.",
  },
];

export const segmentsFilters = [
  { label: "Tipe", options: ["Semua", "System", "Custom"] },
  { label: "Status", options: ["Semua", "Aktif", "Nonaktif"] },
  { label: "Dibuat Oleh", options: ["Semua", "System", "Dinda", "Sarah"] },
];
