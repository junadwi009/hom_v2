import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-24 animate-pulse rounded-lg border bg-stone-100", className)}
      role="status"
      aria-label="Loading"
    />
  );
}
