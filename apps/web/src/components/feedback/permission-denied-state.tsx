import { LockKeyhole } from "lucide-react";

export function PermissionDeniedState() {
  return (
    <div className="rounded-lg border bg-background-card p-6">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 size-5 text-amber-800" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Permission required</h2>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            This placeholder represents a future backend permission check before sensitive data is shown.
          </p>
        </div>
      </div>
    </div>
  );
}
