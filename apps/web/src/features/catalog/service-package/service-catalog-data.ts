import {
  Briefcase,
  CircleDollarSign,
  Package,
  Star,
  TicketPercent,
  TrendingDown,
} from "lucide-react";

import type { ClientKpi } from "@/features/clients/shared/clients-kpi-card";

export const serviceKpis: ClientKpi[] = [
  {
    icon: Briefcase,
    label: "Total Services",
    value: "18",
    trend: { tone: "up", label: "3 baru bulan ini" },
    accent: "info",
  },
  {
    icon: Package,
    label: "Active Packages",
    value: "12",
    trend: { tone: "up", label: "2 baru bulan ini" },
    accent: "success",
  },
  {
    icon: Star,
    label: "Best Seller",
    value: "Monthly Unlimited",
    helper: "42 terjual · Rp 31.500.000",
    accent: "warning",
  },
  {
    icon: CircleDollarSign,
    label: "Revenue (MTD)",
    value: "Rp 72.540.000",
    trend: { tone: "up", label: "18% vs bulan lalu" },
    accent: "info",
  },
  {
    icon: TrendingDown,
    label: "Low Performer",
    value: "Private Yoga 1:1",
    helper: "2 booking · Rp 900.000",
    accent: "danger",
  },
  {
    icon: TicketPercent,
    label: "Expiring Promo",
    value: "2 Promo",
    helper: "Berakhir dalam 3 hari",
    accent: "default",
  },
];

export type ProductType =
  | "Membership"
  | "Class Pack"
  | "Trial Offer"
  | "Service"
  | "Bundle";
export type ProductStatus = "Active" | "Draft" | "Archived";

export type Product = {
  id: string;
  name: string;
  type: ProductType;
  price: string;
  unit: string;
  description: string;
  soldMtd: number;
  revenue: string;
  status: ProductStatus;
  bestSeller?: boolean;
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Monthly Unlimited",
    type: "Membership",
    price: "Rp 750.000",
    unit: "30 hari",
    description: "Unlimited kelas untuk semua kelas reguler.",
    soldMtd: 42,
    revenue: "Rp 31.500.000",
    status: "Active",
    bestSeller: true,
  },
  {
    id: "p2",
    name: "10 Class Pack",
    type: "Class Pack",
    price: "Rp 1.200.000",
    unit: "60 hari",
    description: "10x kelas reguler, semua jenis kelas.",
    soldMtd: 24,
    revenue: "Rp 28.800.000",
    status: "Active",
  },
  {
    id: "p3",
    name: "5 Class Pack",
    type: "Class Pack",
    price: "Rp 650.000",
    unit: "45 hari",
    description: "5x kelas reguler, semua jenis kelas.",
    soldMtd: 18,
    revenue: "Rp 11.700.000",
    status: "Active",
  },
  {
    id: "p4",
    name: "Trial Class",
    type: "Trial Offer",
    price: "Rp 99.000",
    unit: "7 hari",
    description: "1x kelas untuk pengalaman pertama.",
    soldMtd: 64,
    revenue: "Rp 6.336.000",
    status: "Active",
  },
  {
    id: "p5",
    name: "Private Yoga 1:1",
    type: "Service",
    price: "Rp 450.000",
    unit: "75 menit",
    description: "Sesi private 1-on-1 dengan instruktur pilihan.",
    soldMtd: 2,
    revenue: "Rp 900.000",
    status: "Active",
  },
  {
    id: "p6",
    name: "Prenatal Yoga",
    type: "Service",
    price: "Rp 200.000",
    unit: "60 menit",
    description: "Kelas khusus untuk ibu hamil dengan instruktur tersertifikasi.",
    soldMtd: 9,
    revenue: "Rp 1.800.000",
    status: "Active",
  },
  {
    id: "p7",
    name: "Beginner Starter Pack",
    type: "Bundle",
    price: "Rp 399.000",
    unit: "14 hari",
    description: "3x kelas reguler untuk pemula, berlaku 14 hari.",
    soldMtd: 12,
    revenue: "Rp 4.788.000",
    status: "Draft",
  },
  {
    id: "p8",
    name: "Weekend Workshop",
    type: "Service",
    price: "Rp 250.000",
    unit: "120 menit",
    description: "Workshop tematik setiap akhir pekan.",
    soldMtd: 7,
    revenue: "Rp 1.750.000",
    status: "Active",
  },
];

export const serviceAiInsight = [
  "Monthly Unlimited menghasilkan revenue tertinggi dengan retention rate 64%.",
  "Trial Class conversion ke package masih rendah (32%).",
  "Rekomendasi: dorong Beginner Starter Pack untuk meningkatkan conversion.",
];

export const serviceFilters = [
  { label: "Tipe Produk", options: ["Semua Tipe", "Membership", "Class Pack", "Trial Offer", "Service", "Bundle"] },
  { label: "Status", options: ["Semua Status", "Active", "Draft", "Archived"] },
  { label: "Cabang", options: ["Semua Cabang", "HOM Kemang", "HOM Menteng"] },
  { label: "Visibility", options: ["Semua Visibility", "Public", "Hidden"] },
];
