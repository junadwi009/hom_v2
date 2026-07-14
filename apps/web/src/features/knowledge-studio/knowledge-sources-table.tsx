import { Badge } from "@/components/ui/badge";

import type { KnowledgeSourceRow } from "./knowledge-studio-page-state";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  published: "success",
  embedded: "info",
  extracted: "info",
  processing: "warning",
  uploaded: "neutral",
  review_needed: "warning",
  failed: "danger",
  archived: "neutral",
};

export function KnowledgeSourcesTable({ rows }: { rows: KnowledgeSourceRow[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-stone-50 text-left text-foreground-muted">
        <tr>
          <th className="px-3 py-2">Title</th>
          <th className="px-3 py-2">Type</th>
          <th className="px-3 py-2">Scope</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">Version</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t">
            <td className="px-3 py-2 font-medium text-foreground">{row.title}</td>
            <td className="px-3 py-2">{row.docType}</td>
            <td className="px-3 py-2">{row.scopes}</td>
            <td className="px-3 py-2">
              <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>
            </td>
            <td className="px-3 py-2">v{row.version}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
