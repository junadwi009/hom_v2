import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-background-card p-6 text-center">
      <Inbox className="mx-auto size-8 text-foreground-muted" aria-hidden="true" />
      <h2 className="mt-3 text-sm font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-foreground-muted">{description}</p>
    </div>
  );
}
