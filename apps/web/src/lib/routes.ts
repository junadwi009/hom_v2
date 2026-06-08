import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CheckCheck,
  CircleDollarSign,
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
  {
    label: "Clients",
    icon: Users,
    children: [
      { label: "Client Management", href: "/clients" },
      { label: "Leads", href: "/clients/leads" },
      { label: "Segments", href: "/clients/segments" },
      { label: "Tags", href: "/clients/tags" },
    ],
  },
  { label: "Practitioners", href: "/practitioners", icon: Stethoscope },
  { label: "Service & Paket", href: "/catalog", icon: Package },
  { label: "Client Packages", href: "/client-packages", icon: BadgeCheck },
  { label: "Payments", href: "/payments", icon: Wallet },
  { label: "Financials", href: "/financials", icon: CircleDollarSign },
  { label: "Approval Center", href: "/approvals", icon: CheckCheck },
  {
    label: "Settings",
    icon: Settings,
    children: [
      {
        label: "User Management",
        children: [
          { label: "User Management", href: "/settings/user-management" },
          { label: "Roles & Permissions", href: "/settings/roles-permissions" },
          { label: "Branch Management", href: "/settings/branch-management" },
          { label: "Audit Logs", href: "/settings/audit-logs" },
        ],
      },
      {
        label: "AI Management",
        children: [
          { label: "AI Business Agent", href: "/settings/ai-management/business-agent" },
          { label: "Knowledge Studio", href: "/settings/ai-management/knowledge-studio" },
          {
            label: "Behavior Intelligence",
            href: "/settings/ai-management/behavior-intelligence",
          },
        ],
      },
    ],
  },
];

// Modules whose backend is not built yet — shown muted under a "Coming soon" group.
export const comingSoonNavigation = [
  { label: "Live Chat", href: "/live-chat", icon: MessageSquareText },
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
  { label: "User Management", href: "/settings/user-management" },
  { label: "Approvals & Payroll", href: "/approvals" },
];

export const quickActions = [
  { label: "New appointment", href: "/appointments" },
  { label: "Open approvals", href: "/approvals" },
  { label: "Review knowledge", href: "/settings/ai-management/knowledge-studio" },
];
