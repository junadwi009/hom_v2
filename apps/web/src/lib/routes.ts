import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CheckCheck,
  CircleDollarSign,
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
        ],
      },
    ],
  },
];

export const primaryNavigation = [...operationalNavigation];

export const executiveTabs = [
  { label: "Strategic Overview", href: "/dashboard/executive-command" },
  { label: "Financial Strategy", href: "/financials" },
  { label: "Client LTV & Milestones", href: "/clients" },
  { label: "User Management", href: "/settings/user-management" },
  { label: "Approvals & Payroll", href: "/approvals" },
];

export type QuickAction = { label: string; href: string };

export const quickActions: QuickAction[] = [
  { label: "New appointment", href: "/appointments" },
  { label: "Open approvals", href: "/approvals" },
  { label: "Review knowledge", href: "/settings/ai-management/knowledge-studio" },
];

// Context-aware topbar quick actions. Finance sections surface their own
// in-page actions via deep links (?create=1 / ?export=1) so the topbar buttons
// actually do something on the destination page; everything else keeps the
// global defaults.
export function getQuickActions(pathname: string): QuickAction[] {
  if (pathname.startsWith("/financials")) {
    return [
      { label: "Export Report", href: "/financials?export=1" },
      { label: "Catat Transaksi", href: "/financials?create=1" },
      { label: "Open Payments", href: "/payments" },
    ];
  }
  if (pathname.startsWith("/payments")) {
    return [
      { label: "Create Payment", href: "/payments?create=1" },
      { label: "Financial Overview", href: "/financials" },
      { label: "Export", href: "/payments?export=1" },
    ];
  }
  if (pathname.startsWith("/approvals")) {
    // "Open approvals" is redundant here — surface the Approval Rules deep link.
    return [
      { label: "New appointment", href: "/appointments" },
      { label: "Approval Rules", href: "/approvals?rules=1" },
      { label: "Review knowledge", href: "/settings/ai-management/knowledge-studio" },
    ];
  }
  return quickActions;
}
