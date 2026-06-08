import { MoreVertical, Pencil, Tag as TagIcon, Trash2 } from "lucide-react";

import { DemoIconButton } from "@/features/shell/demo-action";
import { cn } from "@/lib/utils";

import { TypeBadge } from "../shared/type-badge";
import type { ClientTag } from "./tags-data";

export function TagsTable({ tags }: { tags: ClientTag[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[940px] border-collapse text-left text-sm">
        <thead className="text-xs uppercase text-foreground-muted">
          <tr>
            <th className="border-b px-3 py-2 font-semibold">Nama Tag</th>
            <th className="border-b px-3 py-2 font-semibold">Tipe</th>
            <th className="border-b px-3 py-2 font-semibold">Dibuat Oleh</th>
            <th className="border-b px-3 py-2 font-semibold">Jumlah Client</th>
            <th className="border-b px-3 py-2 font-semibold">Deskripsi</th>
            <th className="border-b px-3 py-2 font-semibold">Digunakan Terakhir</th>
            <th className="border-b px-3 py-2 font-semibold">Status</th>
            <th className="border-b px-3 py-2 text-right font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr className="border-b last:border-b-0 hover:bg-stone-50/70" key={tag.id}>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-2 font-medium text-foreground">
                  <TagIcon
                    aria-hidden="true"
                    className="size-4"
                    style={{ color: tag.color }}
                  />
                  {tag.name}
                </span>
              </td>
              <td className="px-3 py-3">
                <TypeBadge type={tag.type} />
              </td>
              <td className="px-3 py-3 text-foreground-muted">{tag.createdBy}</td>
              <td className="px-3 py-3">
                <span className="font-medium text-foreground">{tag.clientCount}</span>{" "}
                <span className="text-xs text-foreground-muted">({tag.clientPct})</span>
              </td>
              <td className="px-3 py-3 text-foreground-muted">{tag.description}</td>
              <td className="px-3 py-3 text-foreground-muted">{tag.lastUsed}</td>
              <td className="px-3 py-3">
                <StatusToggle on={tag.active} />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-1">
                  <DemoIconButton
                    className="flex size-8 items-center justify-center rounded-md hover:bg-stone-100"
                    label="Edit"
                    message={`Edit tag "${tag.name}" (demo).`}
                  >
                    <Pencil className="size-4 text-foreground-muted" aria-hidden="true" />
                  </DemoIconButton>
                  <DemoIconButton
                    className="flex size-8 items-center justify-center rounded-md hover:bg-stone-100"
                    label="Hapus"
                    message={`Hapus tag "${tag.name}"? (demo).`}
                  >
                    <Trash2 className="size-4 text-foreground-muted" aria-hidden="true" />
                  </DemoIconButton>
                  <DemoIconButton
                    className="flex size-8 items-center justify-center rounded-md hover:bg-stone-100"
                    label="Aksi lain"
                    message={`Menu aksi untuk tag "${tag.name}" (demo).`}
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

function StatusToggle({ on }: { on: boolean }) {
  return (
    <span
      aria-label={on ? "Aktif" : "Nonaktif"}
      className={cn(
        "inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
        on ? "bg-green-500" : "bg-stone-300",
      )}
      role="img"
    >
      <span
        className={cn(
          "size-4 rounded-full bg-white shadow transition-transform",
          on && "translate-x-4",
        )}
      />
    </span>
  );
}

