"use client";

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getRiskBadgeTone, getRiskLabel } from "./approval-helpers";
import type { ApprovalRule } from "./approval-types";

export function ApprovalRulesModal({
  rules,
  onClose,
}: {
  rules: ApprovalRule[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        aria-label="Tutup"
        className="absolute inset-0 bg-stone-950/40"
        onClick={onClose}
        type="button"
      />
      <div
        aria-modal="true"
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border bg-background-card shadow-2xl"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Approval Rules</h2>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Aturan persetujuan yang berlaku (read-only — mock).
            </p>
          </div>
          <Button aria-label="Tutup" onClick={onClose} size="icon" type="button" variant="ghost">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </header>

        <div className="overflow-y-auto px-5 py-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-normal text-foreground-muted">
                <th className="py-2 pr-3 font-medium">Aksi</th>
                <th className="py-2 pr-3 font-medium">Kondisi</th>
                <th className="py-2 pr-3 font-medium">Approver</th>
                <th className="py-2 pr-3 font-medium">Risk</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr className="border-b last:border-0" key={rule.id}>
                  <td className="py-2.5 pr-3 font-medium text-foreground">{rule.actionType}</td>
                  <td className="py-2.5 pr-3 text-foreground-muted">{rule.condition}</td>
                  <td className="py-2.5 pr-3 text-foreground-muted">{rule.approverRole}</td>
                  <td className="py-2.5 pr-3">
                    <Badge tone={getRiskBadgeTone(rule.risk)}>{getRiskLabel(rule.risk)}</Badge>
                  </td>
                  <td className="py-2.5">
                    <Badge tone={rule.isActive ? "success" : "neutral"}>
                      {rule.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="border-t px-5 py-3 text-right">
          <Button onClick={onClose} size="sm" type="button" variant="secondary">
            Tutup
          </Button>
        </footer>
      </div>
    </div>
  );
}
