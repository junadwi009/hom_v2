"use client";

import { MessageCircle, MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DemoIconButton } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import { ScoreRing } from "../shared/score-ring";
import type { Lead, LeadSource, LeadStage, LeadStatus } from "./leads-data";

const sourceTone: Record<LeadSource, "danger" | "success" | "info" | "warning" | "neutral"> = {
  Instagram: "danger",
  WhatsApp: "success",
  Google: "info",
  Referral: "warning",
  "Walk-in": "neutral",
  "Facebook Ads": "info",
};

const stageTone: Record<LeadStage, "neutral" | "info" | "warning" | "success"> = {
  "New Lead": "neutral",
  "Trial Booked": "info",
  "Trial Attended": "warning",
  "Member Converted": "success",
};

const statusTone: Record<LeadStatus, "danger" | "warning" | "info"> = {
  Hot: "danger",
  Warm: "warning",
  Cold: "info",
};

export function LeadTable({
  leads,
  selectedId,
  onSelect,
}: {
  leads: Lead[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase text-foreground-muted">
          <tr>
            <th className="border-b px-3 py-2 font-semibold">Lead</th>
            <th className="border-b px-3 py-2 font-semibold">Sumber</th>
            <th className="border-b px-3 py-2 font-semibold">Tahap</th>
            <th className="border-b px-3 py-2 font-semibold">Status</th>
            <th className="border-b px-3 py-2 font-semibold">Next Action</th>
            <th className="border-b px-3 py-2 font-semibold">Assigned</th>
            <th className="border-b px-3 py-2 font-semibold">Score</th>
            <th className="border-b px-3 py-2 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              className={cn(
                "cursor-pointer border-b last:border-b-0 hover:bg-stone-50/70",
                lead.id === selectedId && "bg-accent-gold-muted/40",
              )}
              key={lead.id}
              onClick={() => onSelect(lead.id)}
            >
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-gold-muted text-xs font-semibold text-amber-900">
                    {lead.initials}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-foreground-muted">{lead.phone}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3">
                <Badge tone={sourceTone[lead.source]}>{lead.source}</Badge>
              </td>
              <td className="px-3 py-3">
                <Badge tone={stageTone[lead.stage]}>{lead.stage}</Badge>
              </td>
              <td className="px-3 py-3">
                <Badge tone={statusTone[lead.status]}>{lead.status}</Badge>
              </td>
              <td className="px-3 py-3">
                <p className="text-foreground">{lead.nextAction}</p>
                <p className="text-xs text-foreground-muted">{lead.nextActionVia}</p>
              </td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-2 text-foreground-muted">
                  <span className="flex size-6 items-center justify-center rounded-full bg-stone-200 text-[10px] font-semibold text-stone-700">
                    {lead.assignedInitials}
                  </span>
                  {lead.assignedTo}
                </span>
              </td>
              <td className="px-3 py-3">
                <ScoreRing px={40} value={lead.score} />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">
                  <DemoIconButton
                    className="flex size-8 items-center justify-center rounded-md hover:bg-green-50"
                    label="WhatsApp"
                    message={`Membuka chat WhatsApp ke ${lead.name} (demo).`}
                  >
                    <MessageCircle className="size-4 text-green-600" aria-hidden="true" />
                  </DemoIconButton>
                  <DemoIconButton
                    className="flex size-8 items-center justify-center rounded-md hover:bg-stone-100"
                    label="Aksi lain"
                    message={`Menu aksi untuk ${lead.name} (demo).`}
                  >
                    <MoreVertical className="size-4 text-foreground-muted" aria-hidden="true" />
                  </DemoIconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
