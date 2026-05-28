import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FilterBar({
  searchPlaceholder = "Search mock records",
  filters = ["Today", "This week", "Needs review"],
}: {
  searchPlaceholder?: string;
  filters?: string[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background-card p-3 md:flex-row md:items-center md:justify-between">
      <label className="flex min-h-10 flex-1 items-center gap-2 rounded-md border bg-white px-3 text-sm text-foreground-muted">
        <Search className="size-4" aria-hidden="true" />
        <span>{searchPlaceholder}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button key={filter} type="button" variant="secondary" size="sm">
            {filter}
          </Button>
        ))}
      </div>
    </div>
  );
}
