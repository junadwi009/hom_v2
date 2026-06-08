import { Badge } from "@/components/ui/badge";

export function TypeBadge({ type }: { type: "System" | "Custom" }) {
  return <Badge tone={type === "System" ? "info" : "neutral"}>{type}</Badge>;
}
