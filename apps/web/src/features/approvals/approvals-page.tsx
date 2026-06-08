"use client";

import {
  AlertTriangle,
  ClipboardList,
  Clock,
  Download,
  ScrollText,
  Sparkles,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClientKpiRow,
  type ClientKpi,
} from "@/features/clients/shared/clients-kpi-card";
import { ClientTabs } from "@/features/clients/shared/clients-tabs";
import { useToast } from "@/features/shell/toast";
import { formatCompactIDR } from "@/lib/format";

import {
  ApprovalActionModal,
  type ApprovalActionType,
} from "./approval-action-modal";
import { ApprovalDetailPanel } from "./approval-detail-panel";
import {
  canApproveRequest,
  canViewSensitive,
  computeApprovalKpis,
  DOMAIN_LABELS,
  generateApprovalInsight,
  getHighestPriorityRequest,
  getRiskBadgeTone,
  getRiskLabel,
  type CurrentApprovalUser,
} from "./approval-helpers";
import { ApprovalRulesModal } from "./approval-rules-modal";
import { ApprovalTable } from "./approval-table";
import { approvalRequestsSeed, approvalRulesSeed } from "./approvals-data";
import type {
  ApprovalDomain,
  ApprovalRequest,
  ApprovalStatus,
  RiskLevel,
} from "./approval-types";

const DOMAIN_ORDER: ApprovalDomain[] = [
  "financial",
  "client_membership",
  "booking",
  "clinical",
  "team",
  "marketing",
  "admin_governance",
];

const inputClass =
  "h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted";

const STATUS_TO_NEW: Record<ApprovalActionType, ApprovalStatus> = {
  approve: "approved",
  reject: "rejected",
  need_more_info: "need_more_info",
  escalate: "escalated",
};

export function ApprovalsPage({
  currentUser,
  defaultShowRules = false,
}: {
  currentUser: CurrentApprovalUser;
  defaultShowRules?: boolean;
}) {
  const router = useRouter();
  const notify = useToast();

  const [requests, setRequests] = useState<ApprovalRequest[]>(approvalRequestsSeed);
  // Auto-select the highest-priority request on first load (critical > overdue >
  // highest financial impact > pending). Stays null — empty state — if none.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => getHighestPriorityRequest(approvalRequestsSeed)?.id ?? null,
  );
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatus>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [activeAction, setActiveAction] = useState<ApprovalActionType | null>(null);
  const [showRules, setShowRules] = useState(defaultShowRules);

  const kpis = useMemo(() => computeApprovalKpis(requests), [requests]);
  const insight = useMemo(() => generateApprovalInsight(requests), [requests]);
  const branches = useMemo(
    () => [...new Set(requests.map((r) => r.branch))].sort(),
    [requests],
  );

  const domainFilter = tab === 0 ? null : DOMAIN_ORDER[tab - 1];

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchDomain = !domainFilter || r.domain === domainFilter;
      const matchRisk = riskFilter === "all" || r.risk === riskFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchBranch = branchFilter === "all" || r.branch === branchFilter;
      const matchSearch =
        q === "" ||
        r.title.toLowerCase().includes(q) ||
        r.requestedBy.name.toLowerCase().includes(q) ||
        r.relatedRecordLabel.toLowerCase().includes(q);
      return matchDomain && matchRisk && matchStatus && matchBranch && matchSearch;
    });
  }, [requests, domainFilter, riskFilter, statusFilter, branchFilter, search]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;
  const selectedCanApprove = selected
    ? canApproveRequest(currentUser, selected)
    : false;
  const selectedCanViewSensitive = selected
    ? canViewSensitive(currentUser, selected)
    : true;

  const applyAction = (action: ApprovalActionType, note: string) => {
    if (!selected) return;
    const newStatus = STATUS_TO_NEW[action];
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selected.id
          ? {
              ...r,
              status: newStatus,
              history: [
                ...r.history,
                {
                  id: `h_${r.history.length + 1}_${action}`,
                  action,
                  actorName: currentUser.name,
                  timestamp: new Date().toISOString(),
                  note: note || undefined,
                },
              ],
            }
          : r,
      ),
    );
    setActiveAction(null);
    notify(`Request "${selected.title}" → ${newStatus} (lokal).`);
  };

  const viewRelated = () => {
    if (!selected) return;
    if (selected.relatedRoute) {
      router.push(selected.relatedRoute);
    } else {
      notify("Halaman record terkait belum tersedia.");
    }
  };

  const kpiCards: ClientKpi[] = [
    { icon: ClipboardList, label: "Pending Approval", value: String(kpis.pending), helper: "menunggu keputusan", accent: "warning" },
    { icon: AlertTriangle, label: "Urgent / High Risk", value: String(kpis.urgent), helper: "risk tinggi/kritis", accent: kpis.urgent > 0 ? "danger" : "default" },
    { icon: Wallet, label: "Financial Impact", value: formatCompactIDR(kpis.financialImpact), helper: "total nominal aktif", accent: "info" },
    { icon: Stethoscope, label: "Clinical Review", value: String(kpis.clinicalReview), helper: "butuh review klinis", accent: "danger" },
    { icon: Clock, label: "Overdue", value: String(kpis.overdue), helper: ">24 jam menunggu", accent: kpis.overdue > 0 ? "danger" : "default" },
    { icon: ClipboardList, label: "Approved", value: String(kpis.approvedThisMonth), helper: "disetujui (mock)", accent: "success" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Governance"
        title="Approval Center"
        description="Kelola semua permintaan persetujuan lintas modul."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setShowRules(true)} size="sm" type="button" variant="secondary">
              <ScrollText aria-hidden="true" className="size-4" /> Approval Rules
            </Button>
            <Button onClick={() => notify("Export approval queue (mock).")} size="sm" type="button" variant="secondary">
              <Download aria-hidden="true" className="size-4" /> Export
            </Button>
            <Button onClick={() => notify("Pembuatan request manual menyusul (mock).")} size="sm" type="button">
              Create Request
            </Button>
          </div>
        }
      />

      <ClientKpiRow className="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" items={kpiCards} />

      {/* Insight */}
      <section className="rounded-lg border border-accent-gold-muted bg-accent-gold-muted/20 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
          Approval Summary
        </p>
        <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{insight.text}</p>
        {insight.top.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs">
            {insight.top.map((r) => (
              <li className="flex items-center gap-2" key={r.id}>
                <Badge tone={getRiskBadgeTone(r.risk)}>{getRiskLabel(r.risk)}</Badge>
                <button
                  className="text-left text-foreground hover:underline"
                  onClick={() => setSelectedId(r.id)}
                  type="button"
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => setRiskFilter("high")} size="sm" type="button" variant="secondary">
            Review High Risk
          </Button>
          <Button onClick={() => setTab(1)} size="sm" type="button" variant="secondary">
            View Financial
          </Button>
          <Button onClick={() => setTab(4)} size="sm" type="button" variant="secondary">
            View Clinical
          </Button>
        </div>
      </section>

      <ClientTabs
        onChange={(i) => setTab(i)}
        tabs={["Semua", ...DOMAIN_ORDER.map((d) => DOMAIN_LABELS[d])]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border bg-background-card p-4 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              aria-label="Cari request"
              className={`${inputClass} w-52`}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari request / requester..."
              type="search"
              value={search}
            />
            <select aria-label="Risk" className={inputClass} onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)} value={riskFilter}>
              <option value="all">Semua Risk</option>
              <option value="low">Rendah</option>
              <option value="medium">Sedang</option>
              <option value="high">Tinggi</option>
              <option value="critical">Kritis</option>
            </select>
            <select aria-label="Status" className={inputClass} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} value={statusFilter}>
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="need_more_info">Butuh Info</option>
              <option value="escalated">Dieskalasi</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
            <select aria-label="Cabang" className={inputClass} onChange={(e) => setBranchFilter(e.target.value)} value={branchFilter}>
              <option value="all">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <span className="ml-auto text-xs text-foreground-muted">{visible.length} request</span>
          </div>
          <ApprovalTable onSelect={setSelectedId} requests={visible} selectedId={selectedId} />
        </section>

        {/* Inline detail panel (desktop) — sticky, ~30% width */}
        <div className="hidden self-start xl:sticky xl:top-4 xl:block">
          <ApprovalDetailPanel
            canApprove={selectedCanApprove}
            canViewSensitive={selectedCanViewSensitive}
            onAction={(a) => setActiveAction(a)}
            onViewRelated={viewRelated}
            request={selected}
          />
        </div>
      </div>

      {/* Drawer detail panel (tablet/mobile) */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
          <button aria-label="Tutup" className="absolute inset-0 bg-stone-950/35" onClick={() => setSelectedId(null)} type="button" />
          <div className="relative z-10 h-full w-full max-w-md overflow-y-auto bg-background-app p-4">
            <ApprovalDetailPanel
              canApprove={selectedCanApprove}
              canViewSensitive={selectedCanViewSensitive}
              onAction={(a) => setActiveAction(a)}
              onViewRelated={viewRelated}
              request={selected}
            />
          </div>
        </div>
      ) : null}

      {activeAction && selected ? (
        <ApprovalActionModal
          action={activeAction}
          onClose={() => setActiveAction(null)}
          onConfirm={(note) => applyAction(activeAction, note)}
          request={selected}
        />
      ) : null}

      {showRules ? (
        <ApprovalRulesModal onClose={() => setShowRules(false)} rules={approvalRulesSeed} />
      ) : null}
    </div>
  );
}
