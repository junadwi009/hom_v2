import type { MetricCardProps } from "@/components/hom/metric-card";
import type { ModuleMockPageProps } from "@/features/module-page/module-mock-page";

export const attentionItems = [
  {
    title: "WhatsApp blast approvals",
    value: "3 pending",
    status: "warning",
    detail: "Campaign drafts waiting for owner review.",
  },
  {
    title: "Reminder delivery",
    value: "2 failed",
    status: "danger",
    detail: "Retry queue placeholder, no provider connected.",
  },
  {
    title: "Finance reconciliation",
    value: "1 issue",
    status: "warning",
    detail: "Mock period mismatch surfaced for review.",
  },
  {
    title: "Reschedule confirmations",
    value: "4 open",
    status: "info",
    detail: "Front desk needs final client confirmation.",
  },
];

export const executiveMetrics = [
  {
    label: "Monthly Revenue",
    value: "Rp 184.2M",
    helper: "Mock May 2026 period",
    trend: "+12.4%",
    tone: "success",
  },
  {
    label: "Active Clients",
    value: "486",
    helper: "Mock client registry",
    trend: "+28",
    tone: "success",
  },
  {
    label: "Pending Approvals",
    value: "9",
    helper: "Blasts, notes, reimbursements",
    trend: "needs review",
    tone: "warning",
  },
  {
    label: "Open Chat Interventions",
    value: "14",
    helper: "Human-controlled AI handoff",
    trend: "draft only",
    tone: "info",
  },
] satisfies MetricCardProps[];

export const practitionerRows = [
  { practitioner: "Firly", utilization: "82%", sessions: "38", status: "On track" },
  { practitioner: "Maya", utilization: "76%", sessions: "31", status: "Monitoring" },
  { practitioner: "Raka", utilization: "69%", sessions: "27", status: "Healthy" },
];

export const appointmentRows = [
  { time: "09:00", client: "Nadia A.", service: "Clinical Pilates", practitioner: "Firly", status: "confirmed" },
  { time: "10:30", client: "Bima R.", service: "Posture Assessment", practitioner: "Maya", status: "scheduled" },
  { time: "13:00", client: "Clara S.", service: "Private Session", practitioner: "Raka", status: "reschedule_requested" },
  { time: "16:00", client: "Dewi K.", service: "Clinical Pilates", practitioner: "Firly", status: "done" },
];

export const modulePages = {
  appointments: {
    eyebrow: "Operations",
    title: "Appointments",
    description: "Mock schedule view for booking, reschedule, cancellation, and practitioner conflict handling.",
    metrics: [
      { label: "Today", value: "28", helper: "scheduled sessions", trend: "4 need follow-up", tone: "warning" },
      { label: "Confirmed", value: "21", helper: "client confirmed", trend: "75%", tone: "success" },
      { label: "No-show risk", value: "3", helper: "mock behavior flags", trend: "watch", tone: "danger" },
    ],
    columns: ["Time", "Client", "Service", "Practitioner", "Status"],
    rows: appointmentRows.map((row) => ({
      Time: row.time,
      Client: row.client,
      Service: row.service,
      Practitioner: row.practitioner,
      Status: row.status,
    })),
  },
  clients: {
    eyebrow: "Registry",
    title: "Clients",
    description: "Mock client registry surface for lifecycle status, practitioner ownership, and safe future search.",
    metrics: [
      { label: "Active", value: "486", helper: "mock clients", trend: "+28", tone: "success" },
      { label: "At risk", value: "18", helper: "needs contact", trend: "review", tone: "warning" },
      { label: "New this month", value: "42", helper: "mock intake", trend: "+9%", tone: "success" },
    ],
    columns: ["Client", "Primary Practitioner", "Lifecycle", "Last Visit"],
    rows: [
      { Client: "Nadia A.", "Primary Practitioner": "Firly", Lifecycle: "Active package", "Last Visit": "Today" },
      { Client: "Bima R.", "Primary Practitioner": "Maya", Lifecycle: "Assessment", "Last Visit": "Yesterday" },
      { Client: "Clara S.", "Primary Practitioner": "Raka", Lifecycle: "Retention watch", "Last Visit": "May 20" },
    ],
  },
  liveChat: {
    eyebrow: "Communication",
    title: "Live Chat",
    description: "Mock WhatsApp inbox with AI drafts kept human-controlled and manual intervention visible.",
    metrics: [
      { label: "Open conversations", value: "37", helper: "mock inbox", trend: "14 intervention", tone: "warning" },
      { label: "AI drafts", value: "22", helper: "not auto-sent", trend: "draft only", tone: "info" },
      { label: "Escalations", value: "5", helper: "clinical or refund risk", trend: "human", tone: "danger" },
    ],
    columns: ["Conversation", "Intent", "Owner", "Safety"],
    rows: [
      { Conversation: "Nadia A.", Intent: "Reschedule request", Owner: "Front desk", Safety: "Backend check required" },
      { Conversation: "Bima R.", Intent: "Pain question", Owner: "Practitioner", Safety: "Clinical escalation" },
      { Conversation: "Clara S.", Intent: "Package pricing", Owner: "Admin", Safety: "Knowledge source needed" },
    ],
  },
  knowledgeStudio: {
    eyebrow: "AI Governance",
    title: "Knowledge Studio",
    description: "Mock owner workspace for upload, extraction review, source scope, testing, publish, and rollback.",
    metrics: [
      { label: "Sources", value: "18", helper: "mock library", trend: "4 review", tone: "warning" },
      { label: "Published versions", value: "6", helper: "rollbackable", trend: "stable", tone: "success" },
      { label: "Test pass rate", value: "91%", helper: "mock lab", trend: "+3%", tone: "success" },
    ],
    columns: ["Source", "Scope", "Status", "Version"],
    rows: [
      { Source: "May pricing sheet", Scope: "public_chatbot", Status: "review_required", Version: "v3" },
      { Source: "Clinical escalation SOP", Scope: "clinical_safety", Status: "published", Version: "v2" },
      { Source: "Campaign tone examples", Scope: "marketing", Status: "tested", Version: "v1" },
    ],
  },
  behavior: {
    eyebrow: "Customer Intelligence",
    title: "Behavior Intelligence",
    description: "Mock aggregate insight dashboard that keeps raw chat hidden until a permitted drill-down exists.",
    metrics: [
      { label: "Top intents", value: "8", helper: "weekly clusters", trend: "aggregate", tone: "info" },
      { label: "FAQ gaps", value: "11", helper: "unanswered questions", trend: "review", tone: "warning" },
      { label: "Churn risk", value: "6", helper: "mock profiles", trend: "call list", tone: "danger" },
    ],
    columns: ["Insight", "Evidence Count", "Action", "Risk"],
    rows: [
      { Insight: "Private class price questions", "Evidence Count": "28", Action: "Update FAQ draft", Risk: "low" },
      { Insight: "Thursday evening demand", "Evidence Count": "17", Action: "Review schedule", Risk: "medium" },
      { Insight: "Post-surgery safety questions", "Evidence Count": "9", Action: "Clinical escalation rule", Risk: "high" },
    ],
  },
  financials: {
    eyebrow: "Finance",
    title: "Financials",
    description: "Mock financial strategy surface. Real finance logic is intentionally deferred until backend validation exists.",
    metrics: [
      { label: "Revenue", value: "Rp 184.2M", helper: "mock May period", trend: "same filter", tone: "success" },
      { label: "Reconciliation", value: "1", helper: "needs review", trend: "warning", tone: "warning" },
      { label: "Exports", value: "0", helper: "not connected", trend: "placeholder", tone: "info" },
    ],
    columns: ["Line", "Period", "Amount", "Source"],
    rows: [
      { Line: "Private sessions", Period: "May 2026", Amount: "Rp 92.4M", Source: "Mock ledger" },
      { Line: "Group classes", Period: "May 2026", Amount: "Rp 61.8M", Source: "Mock ledger" },
      { Line: "COGS placeholder", Period: "May 2026", Amount: "Rp 24.1M", Source: "Mock ledger" },
    ],
  },
  approvals: {
    eyebrow: "Governance",
    title: "Approvals",
    description: "Mock approval workspace for sensitive actions. AI can suggest; humans approve.",
    metrics: [
      { label: "Pending", value: "9", helper: "mock queue", trend: "owner", tone: "warning" },
      { label: "Clinical unlocks", value: "2", helper: "reason required", trend: "sensitive", tone: "danger" },
      { label: "Processed today", value: "7", helper: "audit-ready", trend: "stable", tone: "success" },
    ],
    columns: ["Request", "Requester", "Risk", "Status"],
    rows: [
      { Request: "WhatsApp blast clearance", Requester: "Marketing", Risk: "medium", Status: "pending" },
      { Request: "Session note unlock", Requester: "Practitioner", Risk: "high", Status: "pending" },
      { Request: "Reimbursement claim", Requester: "Admin", Risk: "medium", Status: "needs evidence" },
    ],
  },
  settings: {
    eyebrow: "System",
    title: "Settings",
    description: "Mock settings entry point for roles, permissions, profile, environment checks, and future audit views.",
    metrics: [
      { label: "Roles", value: "8", helper: "documented", trend: "mock", tone: "info" },
      { label: "Env status", value: "0", helper: "production keys connected", trend: "safe", tone: "success" },
      { label: "Audit policy", value: "on", helper: "planned", trend: "required", tone: "warning" },
    ],
    columns: ["Setting", "Current Phase", "Status", "Owner"],
    rows: [
      { Setting: "Supabase Auth", "Current Phase": "Deferred", Status: "placeholder", Owner: "Phase 2" },
      { Setting: "Permissions", "Current Phase": "Documented", Status: "needs schema", Owner: "Phase 2" },
      { Setting: "Production services", "Current Phase": "Blocked", Status: "not connected", Owner: "Owner approval" },
    ],
  },
  aiAgent: {
    eyebrow: "AI",
    title: "AI Business Agent",
    description: "Mock read-only AI workspace shell. Real AI Gateway, providers, and traces are intentionally deferred.",
    metrics: [
      { label: "Mode", value: "Draft", helper: "no mutations", trend: "safe", tone: "success" },
      { label: "Providers", value: "0", helper: "not connected", trend: "deferred", tone: "info" },
      { label: "Policy blocks", value: "3", helper: "mock examples", trend: "guarded", tone: "warning" },
    ],
    columns: ["Capability", "Phase 1 Behavior", "Sensitive Boundary", "Status"],
    rows: [
      { Capability: "Finance analysis", "Phase 1 Behavior": "Mock summary", "Sensitive Boundary": "Read-only later", Status: "deferred" },
      { Capability: "WhatsApp reply", "Phase 1 Behavior": "Draft placeholder", "Sensitive Boundary": "Human approval", Status: "deferred" },
      { Capability: "Clinical question", "Phase 1 Behavior": "Escalation label", "Sensitive Boundary": "No diagnosis", Status: "blocked" },
    ],
  },
} satisfies Record<string, ModuleMockPageProps>;
