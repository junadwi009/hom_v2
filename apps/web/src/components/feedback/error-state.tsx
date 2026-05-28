import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 text-red-700" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold text-red-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-red-800">{description}</p>
          <Button className="mt-4" type="button" variant="secondary" size="sm">
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
