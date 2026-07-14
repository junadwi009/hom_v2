import { Badge } from "@/components/ui/badge";

const statusTone: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  confirmed: "success",
  scheduled: "info",
  reschedule_requested: "warning",
  done: "success",
  cancelled: "danger",
  no_show: "danger",
  pending: "warning",
  published: "success",
  tested: "info",
  review_required: "warning",
  placeholder: "neutral",
  blocked: "danger",
  deferred: "info",
  active: "success",
  inactive: "neutral",
  prospect: "info",
  archived: "neutral",
  expired: "danger",
  depleted: "warning",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");
  return <Badge tone={statusTone[status] ?? "neutral"}>{label}</Badge>;
}
