// Presentational mock data for the "Fokus Keputusan" overview.
// HOM Clinical Pilates branded. `buildOverviewData(period, branch)` derives a full,
// filter-aware bundle from numeric bases so the date + branch controls actually
// change what is shown. Replace with real loaders when aggregates exist; the
// OverviewData shape below is the integration surface.

export type TrendTone = "up" | "down" | "flat";

export type KpiCard = {
  key: string;
  label: string;
  value: string;
  trend?: { tone: TrendTone; label: string };
  helper?: string;
  variant?: "default" | "danger";
  cta?: string;
};

export type RiskLevel = "tinggi" | "sedang" | "rendah" | "penuh";

export type DecisionClass = {
  time: string;
  className: string;
  instructor: string;
  booked: number;
  capacity: number;
  occupancy: number;
  risk: RiskLevel;
  action: string;
  withWhatsApp?: boolean;
};

export type TrendPoint = { label: string; revenue: number; booking: number };

export type AiRecommendation = {
  title: string;
  detail: string;
  potential?: string;
  action: string;
};

export type AlertItem = {
  tone: "danger" | "warning" | "info" | "neutral";
  title: string;
  subtitle: string;
  count: number;
};

export type ClassPerformance = { name: string; occupancy: number; revenue: number };

export type FunnelStage = { label: string; value: number };

export type MemberRiskItem = {
  tone: "danger" | "warning" | "info" | "neutral";
  title: string;
  count: string;
};

export type RevenueSlice = { label: string; percent: number; color: string };

export type InsightItem = {
  icon: "target" | "money" | "alert" | "brain";
  title: string;
  detail: string;
};

export type OverviewData = {
  kpis: KpiCard[];
  decisionClasses: DecisionClass[];
  decisionTableNote: string;
  trend: {
    series: TrendPoint[];
    caption: string;
    stats: { totalRevenue: string; totalBooking: string; peakLabel: string };
  };
  ai: { summary: string; recommendations: AiRecommendation[] };
  alerts: AlertItem[];
  classPerformance: ClassPerformance[];
  leadFunnel: FunnelStage[];
  leadConversionRate: string;
  memberRisk: MemberRiskItem[];
  revenueMix: RevenueSlice[];
  revenueMixTotal: string;
  insights: InsightItem[];
};

export type PeriodId = "today" | "7d" | "30d";
export type BranchId = "all" | "menteng" | "kemang";

export const periodOptions: { id: PeriodId; label: string }[] = [
  { id: "today", label: "Hari ini, 6 Jun 2025" },
  { id: "7d", label: "7 Hari Terakhir" },
  { id: "30d", label: "30 Hari Terakhir" },
];

export const branchOptions: { id: BranchId; label: string }[] = [
  { id: "all", label: "Semua Cabang" },
  { id: "menteng", label: "Cabang Menteng" },
  { id: "kemang", label: "Cabang Kemang" },
];

const branchFactor: Record<BranchId, number> = {
  all: 1,
  menteng: 0.58,
  kemang: 0.42,
};

const branchOccupancyAdjust: Record<BranchId, number> = {
  all: 0,
  menteng: -3,
  kemang: 2,
};

type PeriodConfig = {
  sumScale: number;
  revenueLabel: string;
  bookingLabel: string;
  compare: string;
  window: string;
  baseOccupancy: number;
  occupancyTrend: { tone: TrendTone; pct: number };
};

const periodConfig: Record<PeriodId, PeriodConfig> = {
  today: {
    sumScale: 1,
    revenueLabel: "Revenue Hari Ini",
    bookingLabel: "Total Booking",
    compare: "vs kemarin",
    window: "hari",
    baseOccupancy: 72,
    occupancyTrend: { tone: "down", pct: 4 },
  },
  "7d": {
    sumScale: 6.8,
    revenueLabel: "Revenue 7 Hari",
    bookingLabel: "Booking 7 Hari",
    compare: "vs minggu lalu",
    window: "minggu",
    baseOccupancy: 70,
    occupancyTrend: { tone: "up", pct: 2 },
  },
  "30d": {
    sumScale: 28,
    revenueLabel: "Revenue 30 Hari",
    bookingLabel: "Booking 30 Hari",
    compare: "vs bulan lalu",
    window: "bulan",
    baseOccupancy: 68,
    occupancyTrend: { tone: "up", pct: 5 },
  },
};

const round = (n: number) => Math.round(n);
const round1 = (n: number) => Math.round(n * 10) / 10;

function rupiah(n: number) {
  return `Rp ${round(n).toLocaleString("id-ID")}`;
}

// Short rupiah using Indonesian unit conventions: rb = ribu, jt = juta,
// M = miliar. (English "M" for million is wrong here — in ID "M" means miliar.)
function rupiahShort(n: number) {
  const format = (value: number, suffix: string) => {
    const rounded = round1(value);
    const text = Number.isInteger(rounded)
      ? String(rounded)
      : rounded.toFixed(1).replace(".", ",");
    return `Rp ${text} ${suffix}`;
  };

  if (n >= 1_000_000_000) return format(n / 1_000_000_000, "M");
  if (n >= 1_000_000) return format(n / 1_000_000, "jt");
  if (n >= 1_000) return format(n / 1_000, "rb");
  return rupiah(n);
}

function juta(n: number) {
  const millions = Math.round((n / 1_000_000) * 100) / 100;
  return `Rp ${millions} Juta`;
}

const baseTrend: Array<[string, number, number]> = [
  ["31 Mei", 2.1, 38],
  ["1 Jun", 4.0, 52],
  ["2 Jun", 8.9, 71],
  ["3 Jun", 4.2, 44],
  ["4 Jun", 6.8, 58],
  ["5 Jun", 5.1, 63],
  ["6 Jun", 7.4, 74],
];

const baseClasses: Array<
  Pick<DecisionClass, "time" | "className" | "instructor" | "capacity" | "withWhatsApp"> & {
    booked: number;
  }
> = [
  { time: "07:00", className: "Reformer Pagi", instructor: "Sarah", booked: 4, capacity: 15, withWhatsApp: true },
  { time: "10:00", className: "Mat Pilates", instructor: "Dinda", booked: 11, capacity: 15 },
  { time: "17:00", className: "Reformer Flow", instructor: "Raka", booked: 15, capacity: 15 },
  { time: "19:00", className: "Core Stability", instructor: "Maya", booked: 8, capacity: 12, withWhatsApp: true },
];

function riskFromOccupancy(booked: number, capacity: number, occupancy: number): RiskLevel {
  if (booked >= capacity) return "penuh";
  if (occupancy >= 70) return "rendah";
  if (occupancy >= 40) return "sedang";
  return "tinggi";
}

function actionForRisk(risk: RiskLevel, waitlist: number): string {
  switch (risk) {
    case "penuh":
      return `Kelola Waitlist (${waitlist})`;
    case "rendah":
      return "Lihat";
    case "tinggi":
      return "Kirim Promo";
    case "sedang":
      return "Kirim Reminder";
  }
}

// Revenue mix shares are branch-invariant; only the total scales.
const revenueMixShares: RevenueSlice[] = [
  { label: "Membership", percent: 52, color: "#4f8a5b" },
  { label: "Class Package", percent: 24, color: "#7c6bb0" },
  { label: "Drop-in", percent: 12, color: "#3f7cae" },
  { label: "Private Session", percent: 8, color: "#c9a227" },
  { label: "Workshop / Event", percent: 4, color: "#cf7a3a" },
];

// Class occupancy/revenue are rates, so they stay stable across branch size.
const baseClassPerformance: ClassPerformance[] = [
  { name: "Reformer Flow", occupancy: 94, revenue: 88 },
  { name: "Core Stability", occupancy: 82, revenue: 71 },
  { name: "Mat Pilates", occupancy: 76, revenue: 64 },
  { name: "Rehab Clinical", occupancy: 48, revenue: 52 },
  { name: "Reformer Pagi", occupancy: 31, revenue: 24 },
];

export function buildOverviewData(period: PeriodId, branch: BranchId): OverviewData {
  const pc = periodConfig[period];
  const bf = branchFactor[branch];

  const revenue = 4_250_000 * pc.sumScale * bf;
  const booking = 56 * pc.sumScale * bf;
  const occupancy = Math.max(
    0,
    Math.min(100, pc.baseOccupancy + branchOccupancyAdjust[branch]),
  );

  const revenueHelper =
    period === "today"
      ? `MTD: ${rupiah(72_500_000 * bf)} / ${rupiah(120_000_000 * bf)}`
      : `Rata-rata harian: ${rupiah(4_250_000 * bf)}`;
  const bookingHelper =
    period === "today"
      ? `Check-in: ${round(42 * bf)} · Cancel: ${round(6 * bf)} · Waitlist: ${round(8 * bf)}`
      : `Rata-rata harian: ${round(56 * bf)} booking`;

  const kpis: KpiCard[] = [
    {
      key: "revenue",
      label: pc.revenueLabel,
      value: rupiah(revenue),
      trend: { tone: "up", label: `18% ${pc.compare}` },
      helper: revenueHelper,
    },
    {
      key: "booking",
      label: pc.bookingLabel,
      value: String(round(booking)),
      trend: { tone: "up", label: `12% ${pc.compare}` },
      helper: bookingHelper,
    },
    {
      key: "occupancy",
      label: "Occupancy Rata-rata",
      value: `${occupancy}%`,
      trend: { tone: pc.occupancyTrend.tone, label: `${pc.occupancyTrend.pct}% ${pc.compare}` },
      helper: "Tertinggi: 18:00 (100%)",
    },
    {
      key: "members",
      label: "Active Members",
      value: String(round(184 * bf)),
      trend: { tone: "up", label: `8% ${pc.compare}` },
      helper: `+${round(18 * bf)} baru bulan ini`,
    },
    {
      key: "expiring",
      label: "Expiring Soon (7 Hari)",
      value: String(round(17 * bf)),
      helper: `Potensi Revenue ${rupiah(12_750_000 * bf)}`,
    },
    {
      key: "action",
      label: "Action Needed",
      value: String(Math.max(1, round(12 * bf))),
      variant: "danger",
      cta: "Lihat prioritas",
    },
  ];

  const decisionClasses: DecisionClass[] = baseClasses.map((item) => {
    const booked = Math.min(item.capacity, round(item.booked * bf));
    const occ = Math.round((booked / item.capacity) * 100);
    const risk = riskFromOccupancy(booked, item.capacity, occ);
    return {
      time: item.time,
      className: item.className,
      instructor: item.instructor,
      booked,
      capacity: item.capacity,
      occupancy: occ,
      risk,
      action: actionForRisk(risk, Math.max(1, round(4 * bf))),
      withWhatsApp: item.withWhatsApp,
    };
  });

  const trendSeries: TrendPoint[] = baseTrend.map(([label, rev, bk]) => ({
    label,
    revenue: round1(rev * bf),
    booking: round(bk * bf),
  }));

  const totalTrendRevenue = trendSeries.reduce((sum, point) => sum + point.revenue, 0);
  const totalTrendBooking = trendSeries.reduce((sum, point) => sum + point.booking, 0);
  const peakTrend = trendSeries.reduce(
    (best, point) => (point.revenue > best.revenue ? point : best),
    trendSeries[0],
  );

  const ai = {
    summary: `Bisnis ${branchLabel(branch)} stabil, namun ada beberapa peluang yang jika ditindaklanjuti bisa meningkatkan revenue ${pc.window} ini sebesar ${(2 * bf).toFixed(1)}–${(3 * bf).toFixed(1)} juta.`,
    recommendations: [
      {
        title: `${decisionClasses[0].className} 07:00 hanya ${decisionClasses[0].occupancy}% terisi.`,
        detail: `Kirim promo ke ${round(23 * bf)} member tidak aktif di pagi hari.`,
        potential: `Potensi tambahan: ${rupiah(1_150_000 * bf)}`,
        action: "Kirim Promo",
      },
      {
        title: `${round(17 * bf)} membership akan expired dalam 7 hari.`,
        detail: "Segera hubungi untuk renewal.",
        potential: `Potensi revenue: ${rupiah(12_750_000 * bf)}`,
        action: "Lihat Member",
      },
      {
        title: "Core Stability memiliki risiko no-show sedang.",
        detail: "Kirim reminder 3 jam sebelum kelas.",
        action: "Kirim Reminder",
      },
    ] satisfies AiRecommendation[],
  };

  const alerts: AlertItem[] = [
    {
      tone: "danger",
      title: `${Math.max(1, round(4 * bf))} kelas dengan occupancy rendah`,
      subtitle: "Perlu promosi / perhatian",
      count: Math.max(1, round(4 * bf)),
    },
    {
      tone: "warning",
      title: `${Math.max(1, round(5 * bf))} membership akan expired`,
      subtitle: "Dalam 7 hari ke depan",
      count: Math.max(1, round(5 * bf)),
    },
    {
      tone: "warning",
      title: `${Math.max(1, round(2 * bf))} pembayaran gagal`,
      subtitle: "Perlu ditindaklanjuti",
      count: Math.max(1, round(2 * bf)),
    },
    {
      tone: "info",
      title: "1 review negatif baru",
      subtitle: "Perlu respon",
      count: 1,
    },
  ];

  const leadFunnel: FunnelStage[] = [
    { label: "Inquiry", value: round(120 * bf) },
    { label: "Trial Booked", value: round(64 * bf) },
    { label: "Trial Attended", value: round(48 * bf) },
    { label: "Package Bought", value: round(21 * bf) },
    { label: "Active (30 Days)", value: round(15 * bf) },
  ];

  const memberRisk: MemberRiskItem[] = [
    { tone: "danger", title: "High Risk (tidak datang >14 hari)", count: `${round(23 * bf)} member` },
    { tone: "warning", title: "Trial belum konversi", count: `${round(15 * bf)} member` },
    { tone: "warning", title: "Expiring dalam 7 hari", count: `${round(17 * bf)} member` },
    { tone: "info", title: "New Member (30 hari)", count: `${round(18 * bf)} member` },
  ];

  const insights: InsightItem[] = [
    {
      icon: "target",
      title: "Fokus Utama",
      detail: "Tingkatkan attendance di kelas pagi. Dampak terbesar ke revenue mingguan.",
    },
    {
      icon: "money",
      title: "Peluang Revenue",
      detail: `Rp ${(2 * bf).toFixed(1)} – ${(3 * bf).toFixed(1)} Juta jika semua rekomendasi dijalankan.`,
    },
    {
      icon: "alert",
      title: "Risiko Terbesar",
      detail: `Kehilangan ${juta(12_750_000 * bf)} jika member tidak di-follow up.`,
    },
    {
      icon: "brain",
      title: "Keputusan Cerdas",
      detail: "Fokus pada retention lebih menguntungkan daripada akuisisi member baru.",
    },
  ];

  return {
    kpis,
    decisionClasses,
    decisionTableNote: `4 kelas memiliki occupancy di bawah 40%. Tindakan cepat bisa menambah potensi revenue hingga ${rupiah(1_650_000 * bf)} minggu ini.`,
    trend: {
      series: trendSeries,
      caption:
        "Revenue naik 18% dibanding periode yang sama minggu lalu. Kenaikan terutama dari membership renewal.",
      stats: {
        totalRevenue: rupiahShort(totalTrendRevenue * 1_000_000),
        totalBooking: String(round(totalTrendBooking)),
        peakLabel: peakTrend.label,
      },
    },
    ai,
    alerts,
    classPerformance: baseClassPerformance,
    leadFunnel,
    leadConversionRate: "12,5%",
    memberRisk,
    revenueMix: revenueMixShares,
    revenueMixTotal: rupiahShort(72_500_000 * bf),
    insights,
  };
}

function branchLabel(branch: BranchId) {
  return branchOptions.find((option) => option.id === branch)?.label ?? "Semua Cabang";
}
