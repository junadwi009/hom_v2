import {
  Activity,
  BarChart3,
  BadgeCheck,
  Bot,
  CalendarDays,
  CheckCheck,
  CircleDollarSign,
  FolderOpen,
  MessageSquareText,
  Package,
  Settings,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";

// Modules backed by real Supabase data and working flows.
export const operationalNavigation = [
  { label: "Overview", href: "/", icon: Activity },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Practitioners", href: "/practitioners", icon: Stethoscope },
  { label: "Service & Paket", href: "/catalog", icon: Package },
  { label: "Client Packages", href: "/client-packages", icon: BadgeCheck },
  { label: "Payments", href: "/payments", icon: Wallet },
];

// Modules whose backend is not built yet — shown muted under a "Coming soon" group.
export const comingSoonNavigation = [
  { label: "Live Chat", href: "/live-chat", icon: MessageSquareText },
  { label: "Knowledge Studio", href: "/knowledge-studio", icon: FolderOpen },
  { label: "Behavior Intelligence", href: "/behavior-intelligence", icon: BarChart3 },
  { label: "Financials", href: "/financials", icon: CircleDollarSign },
  { label: "AI Business Agent", href: "/ai-business-agent", icon: Bot },
  { label: "Approvals", href: "/approvals", icon: CheckCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const primaryNavigation = [
  ...operationalNavigation,
  ...comingSoonNavigation,
];

export const executiveTabs = [
  { label: "Strategic Overview", href: "/dashboard/executive-command" },
  { label: "Chronic Case Registry", href: "/clinical-cases" },
  { label: "Team Attendance", href: "/team-attendance" },
  { label: "Financial Strategy", href: "/financials" },
  { label: "Client LTV & Milestones", href: "/clients" },
  { label: "User Management", href: "/settings" },
  { label: "Approvals & Payroll", href: "/approvals" },
];

export const quickActions = [
  { label: "New appointment", href: "/appointments" },
  { label: "Open approvals", href: "/approvals" },
  { label: "Review knowledge", href: "/knowledge-studio" },
];
