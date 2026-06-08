import {
  FileText,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DemoButton, DemoLink } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import { ClientTabs } from "../shared/clients-tabs";
import { leadStageOrder, type Lead, type LeadStatus } from "./leads-data";

const statusTone: Record<LeadStatus, "danger" | "warning" | "info"> = {
  Hot: "danger",
  Warm: "warning",
  Cold: "info",
};

export function LeadDetailPanel({ lead }: { lead: Lead }) {
  const currentStep = leadStageOrder.indexOf(lead.stage);

  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-gold-muted text-sm font-semibold text-amber-900">
          {lead.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
            {lead.name}
            <Badge tone={statusTone[lead.status]}>{lead.status}</Badge>
          </p>
          <p className="text-xs text-foreground-muted">
            {lead.stage} · Lead Score {lead.score}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-5 gap-1">
        <PanelAction
          icon={MessageCircle}
          label="WhatsApp"
          message={`Membuka chat WhatsApp ke ${lead.name} (demo).`}
        />
        <PanelAction
          icon={Phone}
          label="Call"
          message={`Memanggil ${lead.phone} (demo).`}
        />
        <PanelAction
          icon={Mail}
          label="Email"
          message={`Menulis email ke ${lead.email} (demo).`}
        />
        <PanelAction
          icon={FileText}
          label="Add Note"
          message={`Tambah catatan untuk ${lead.name} (demo).`}
        />
        <PanelAction
          icon={MoreHorizontal}
          label="More"
          message="Menu aksi lainnya (demo)."
        />
      </div>

      <ClientTabs tabs={["Overview", "Activity", "Notes", "History"]} />

      <div>
        <p className="text-sm font-semibold text-foreground">Informasi Lead</p>
        <dl className="mt-2 space-y-1 text-xs text-foreground-muted">
          <Row label="Sumber Lead" value={lead.source} />
          <Row label="Tanggal Bergabung" value={lead.joinedDate} />
          <Row label="Nomor" value={lead.phone} />
          <Row label="Email" value={lead.email} />
          <Row label="Minat" value={lead.interest} />
          <Row label="Cabang" value={lead.branch} />
          <Row label="Catatan" value={lead.note} />
        </dl>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Tahap Funnel</p>
        <ol className="mt-3 flex items-center justify-between">
          {leadStageOrder.map((stage, index) => {
            const done = index < currentStep;
            const active = index === currentStep;
            return (
              <li className="flex flex-1 flex-col items-center text-center" key={stage}>
                <div className="flex w-full items-center">
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      index === 0 ? "opacity-0" : done || active ? "bg-accent-gold" : "bg-stone-200",
                    )}
                  />
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      active
                        ? "bg-accent-gold text-stone-950"
                        : done
                          ? "bg-green-500 text-white"
                          : "bg-stone-200 text-stone-500",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      index === leadStageOrder.length - 1
                        ? "opacity-0"
                        : done
                          ? "bg-accent-gold"
                          : "bg-stone-200",
                    )}
                  />
                </div>
                <span className="mt-1 text-[10px] leading-3 text-foreground-muted">
                  {stage}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-md border border-accent-gold-muted bg-accent-gold-muted/30 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
          Next Best Action (AI)
        </p>
        <p className="mt-1 text-xs leading-5 text-foreground-muted">
          {lead.nextBestAction}
        </p>
        <DemoButton
          className="mt-3 w-full"
          message={`Pesan WhatsApp dikirim ke ${lead.name} (demo).`}
          size="sm"
          type="button"
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          Kirim WhatsApp
        </DemoButton>
      </div>

      <div className="rounded-md border p-3">
        <p className="text-sm font-semibold text-foreground">Potensi Revenue</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-foreground-muted">{lead.potentialPackage}</span>
          <span className="font-semibold text-foreground">{lead.potentialRevenue}</span>
        </div>
      </div>
    </section>
  );
}

function PanelAction({
  icon: Icon,
  label,
  message,
}: {
  icon: typeof MessageCircle;
  label: string;
  message: string;
}) {
  return (
    <DemoLink
      className="flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium text-foreground-muted hover:bg-stone-100 hover:text-foreground"
      message={message}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </DemoLink>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
