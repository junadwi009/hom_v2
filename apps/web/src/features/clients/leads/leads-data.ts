import {
  CalendarCheck,
  CircleCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import type { ClientKpi } from "../shared/clients-kpi-card";

export const leadsKpis: ClientKpi[] = [
  {
    icon: Users,
    label: "Total Leads",
    value: "142",
    trend: { tone: "up", label: "18% vs minggu lalu" },
    helper: "+22 lead baru",
    accent: "info",
  },
  {
    icon: UserPlus,
    label: "Leads Baru (7 hari)",
    value: "38",
    trend: { tone: "up", label: "12% vs minggu lalu" },
    accent: "default",
  },
  {
    icon: CalendarCheck,
    label: "Trial Booked",
    value: "24",
    helper: "16.9% conversion rate",
    trend: { tone: "up", label: "8%" },
    accent: "default",
  },
  {
    icon: CircleCheck,
    label: "Trial Attended",
    value: "16",
    helper: "11.3% dari leads",
    trend: { tone: "up", label: "5%" },
    accent: "success",
  },
  {
    icon: UserCheck,
    label: "Member Converted",
    value: "8",
    helper: "5.6% dari leads",
    trend: { tone: "up", label: "2%" },
    accent: "success",
  },
];

export const leadFunnelStages = [
  { label: "New Leads", value: 142, pct: "100%" },
  { label: "Trial Booked", value: 24, pct: "16.9%" },
  { label: "Trial Attended", value: 16, pct: "11.3%" },
  { label: "Member Converted", value: 8, pct: "5.6%" },
];

// Lead-acquisition insights — distinct from the other client sub-pages.
export const leadsInsights = [
  "Lead dari Instagram paling banyak, namun conversion rate WhatsApp lebih tinggi.",
  "Follow up 17 lead yang belum dihubungi >24 jam.",
  "Kirim promo beginner package ke 9 lead yang trial attended.",
];

export type LeadStage =
  | "New Lead"
  | "Trial Booked"
  | "Trial Attended"
  | "Member Converted";
export type LeadStatus = "Hot" | "Warm" | "Cold";
export type LeadSource =
  | "Instagram"
  | "WhatsApp"
  | "Google"
  | "Referral"
  | "Walk-in"
  | "Facebook Ads";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  source: LeadSource;
  stage: LeadStage;
  status: LeadStatus;
  lastContact: string;
  nextAction: string;
  nextActionVia: string;
  assignedTo: string;
  assignedInitials: string;
  score: number;
  joinedDate: string;
  email: string;
  interest: string;
  branch: string;
  note: string;
  nextBestAction: string;
  potentialPackage: string;
  potentialRevenue: string;
};

export const leads: Lead[] = [
  {
    id: "l1",
    name: "Nadia Putri",
    phone: "+62 812 xxx xxx",
    initials: "NP",
    source: "Instagram",
    stage: "Trial Attended",
    status: "Hot",
    lastContact: "5 Jun 2025",
    nextAction: "Kirim promo hari ini",
    nextActionVia: "via WhatsApp",
    assignedTo: "Dinda P.",
    assignedInitials: "DP",
    score: 85,
    joinedDate: "2 Jun 2025",
    email: "nadia.putri@email.com",
    interest: "Beginner Class",
    branch: "HOM Kemang",
    note: "Tertarik kelas pagi & weekend.",
    nextBestAction:
      "Kirim promo Beginner Package (Rp 199.000) dan tawarkan kelas weekend.",
    potentialPackage: "Beginner Package",
    potentialRevenue: "Rp 2.250.000",
  },
  {
    id: "l2",
    name: "Rizky Ananda",
    phone: "+62 813 xxx xxx",
    initials: "RA",
    source: "WhatsApp",
    stage: "Trial Booked",
    status: "Warm",
    lastContact: "6 Jun 2025",
    nextAction: "Konfirmasi trial besok",
    nextActionVia: "via WhatsApp",
    assignedTo: "Sarah A.",
    assignedInitials: "SA",
    score: 72,
    joinedDate: "4 Jun 2025",
    email: "rizky.ananda@email.com",
    interest: "Reformer Beginner",
    branch: "HOM Kemang",
    note: "Sudah booking trial, perlu konfirmasi.",
    nextBestAction: "Konfirmasi jadwal trial besok & kirim lokasi studio.",
    potentialPackage: "Class Pack 10",
    potentialRevenue: "Rp 1.800.000",
  },
  {
    id: "l3",
    name: "Maya Lestari",
    phone: "+62 878 xxx xxx",
    initials: "ML",
    source: "Google",
    stage: "New Lead",
    status: "Warm",
    lastContact: "7 Jun 2025",
    nextAction: "Hubungi lead hari ini",
    nextActionVia: "via Form Website",
    assignedTo: "Raka M.",
    assignedInitials: "RM",
    score: 62,
    joinedDate: "7 Jun 2025",
    email: "maya.lestari@email.com",
    interest: "Mat Pilates",
    branch: "HOM Menteng",
    note: "Mengisi form dari website.",
    nextBestAction: "Hubungi via telepon hari ini & tawarkan trial gratis.",
    potentialPackage: "Trial → Class Pack",
    potentialRevenue: "Rp 1.500.000",
  },
  {
    id: "l4",
    name: "Dewi Kartika",
    phone: "+62 812 xxx xxx",
    initials: "DK",
    source: "Referral",
    stage: "Trial Booked",
    status: "Warm",
    lastContact: "6 Jun 2025",
    nextAction: "Ingatkan trial besok",
    nextActionVia: "via WhatsApp",
    assignedTo: "Dinda P.",
    assignedInitials: "DP",
    score: 71,
    joinedDate: "5 Jun 2025",
    email: "dewi.kartika@email.com",
    interest: "Beginner Class",
    branch: "HOM Kemang",
    note: "Referral dari member aktif.",
    nextBestAction: "Ingatkan trial & sebutkan diskon referral.",
    potentialPackage: "Beginner Package",
    potentialRevenue: "Rp 2.250.000",
  },
  {
    id: "l5",
    name: "Fajar Ramadhan",
    phone: "+62 821 xxx xxx",
    initials: "FR",
    source: "Instagram",
    stage: "New Lead",
    status: "Cold",
    lastContact: "7 Jun 2025",
    nextAction: "Follow up 2 hari lagi",
    nextActionVia: "via DM Instagram",
    assignedTo: "Sarah A.",
    assignedInitials: "SA",
    score: 45,
    joinedDate: "7 Jun 2025",
    email: "fajar.r@email.com",
    interest: "Belum spesifik",
    branch: "HOM Kemang",
    note: "Baru tanya-tanya via DM.",
    nextBestAction: "Kirim konten value + jadwalkan follow up 2 hari lagi.",
    potentialPackage: "Trial",
    potentialRevenue: "Rp 0",
  },
  {
    id: "l6",
    name: "Sari Wulandari",
    phone: "+62 812 xxx xxx",
    initials: "SW",
    source: "WhatsApp",
    stage: "Trial Attended",
    status: "Hot",
    lastContact: "2 Jun 2025",
    nextAction: "Kirim promo hari ini",
    nextActionVia: "via WhatsApp",
    assignedTo: "Raka M.",
    assignedInitials: "RM",
    score: 80,
    joinedDate: "1 Jun 2025",
    email: "sari.w@email.com",
    interest: "Vinyasa Flow",
    branch: "HOM Menteng",
    note: "Trial attended, antusias.",
    nextBestAction: "Tawarkan Monthly Unlimited dengan promo first month.",
    potentialPackage: "Monthly Unlimited",
    potentialRevenue: "Rp 2.500.000",
  },
  {
    id: "l7",
    name: "Budi Santoso",
    phone: "+62 813 xxx xxx",
    initials: "BS",
    source: "Walk-in",
    stage: "Trial Booked",
    status: "Warm",
    lastContact: "9 Jun 2025",
    nextAction: "Konfirmasi trial besok",
    nextActionVia: "via Front Desk",
    assignedTo: "Dinda P.",
    assignedInitials: "DP",
    score: 78,
    joinedDate: "8 Jun 2025",
    email: "budi.santoso@email.com",
    interest: "Hatha Basic",
    branch: "HOM Kemang",
    note: "Datang langsung ke studio.",
    nextBestAction: "Konfirmasi trial & siapkan instruktur Hatha.",
    potentialPackage: "Class Pack 10",
    potentialRevenue: "Rp 1.800.000",
  },
  {
    id: "l8",
    name: "Vina Octavia",
    phone: "+62 811 xxx xxx",
    initials: "VO",
    source: "Facebook Ads",
    stage: "New Lead",
    status: "Cold",
    lastContact: "9 Jun 2025",
    nextAction: "Hubungi lead 2 hari lagi",
    nextActionVia: "via Form FB Ads",
    assignedTo: "Sarah A.",
    assignedInitials: "SA",
    score: 40,
    joinedDate: "9 Jun 2025",
    email: "vina.o@email.com",
    interest: "Belum spesifik",
    branch: "HOM Menteng",
    note: "Lead dari kampanye FB Ads.",
    nextBestAction: "Kualifikasi minat via WhatsApp sebelum follow up.",
    potentialPackage: "Trial",
    potentialRevenue: "Rp 0",
  },
];

export const leadsFilters = [
  { label: "Sumber", options: ["Semua", "Instagram", "WhatsApp", "Google", "Referral", "Walk-in", "Facebook Ads"] },
  { label: "Status", options: ["Semua", "Hot", "Warm", "Cold"] },
  { label: "Tahap", options: ["Semua", "New Lead", "Trial Booked", "Trial Attended", "Member Converted"] },
  { label: "Assigned", options: ["Semua", "Dinda P.", "Sarah A.", "Raka M."] },
];

export const leadStageOrder: LeadStage[] = [
  "New Lead",
  "Trial Booked",
  "Trial Attended",
  "Member Converted",
];
