"use client";

import { MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DemoIconButton } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import type { BranchView } from "./branches-loader";

const statusTone: Record<BranchView["status"], "success" | "neutral" | "warning"> =
  {
    active: "success",
    inactive: "neutral",
    archived: "warning",
  };

const avatarPalette = [
  "bg-amber-100 text-amber-800",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
}

function paletteFor(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return avatarPalette[sum % avatarPalette.length];
}

export function BranchTable({
  branches,
  selectedId,
  onSelect,
}: {
  branches: BranchView[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase text-foreground-muted">
          <tr>
            <th className="border-b px-3 py-2 font-semibold">Cabang</th>
            <th className="border-b px-3 py-2 font-semibold">Lokasi</th>
            <th className="border-b px-3 py-2 font-semibold">Manager</th>
            <th className="border-b px-3 py-2 font-semibold">Tipe</th>
            <th className="border-b px-3 py-2 font-semibold">Status</th>
            <th className="border-b px-3 py-2 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch) => (
            <tr
              className={cn(
                "cursor-pointer border-b last:border-b-0 hover:bg-stone-50/70",
                branch.id === selectedId && "bg-accent-gold-muted/40",
              )}
              key={branch.id}
              onClick={() => onSelect(branch.id)}
            >
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                      paletteFor(branch.name),
                    )}
                  >
                    {initials(branch.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{branch.name}</p>
                    {branch.address ? (
                      <p className="truncate text-xs text-foreground-muted">
                        {branch.address}
                      </p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-foreground-muted">
                {branch.city ?? "—"}
              </td>
              <td className="px-3 py-3 text-foreground-muted">
                {branch.managerName ?? "—"}
              </td>
              <td className="px-3 py-3">
                <Badge tone={branch.branchType === "main" ? "info" : "neutral"}>
                  {branch.branchType === "main" ? "Main" : "Satellite"}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <Badge tone={statusTone[branch.status]}>{branch.status}</Badge>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end">
                  <DemoIconButton
                    className="flex size-8 items-center justify-center rounded-md hover:bg-stone-100"
                    label="Aksi cabang"
                    message={`Menu aksi untuk ${branch.name} (demo).`}
                  >
                    <MoreVertical
                      aria-hidden="true"
                      className="size-4 text-foreground-muted"
                    />
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
