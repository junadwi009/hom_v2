"use client";

import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";

export type ToolbarFilter = { label: string; options: string[] };

// Presentational toolbar: search + filter selects + reset.
// Filtering is illustrative (mock data) — wire to real queries when available.
export function ClientsToolbar({
  searchPlaceholder,
  filters,
  query = "",
  onSearch,
  onFilterChange,
  onReset,
}: {
  searchPlaceholder: string;
  filters: ToolbarFilter[];
  query?: string;
  onSearch?: (value: string) => void;
  onFilterChange?: (label: string, value: string) => void;
  onReset?: () => void;
}) {
  const [localQuery, setLocalQuery] = useState("");
  const searchValue = onSearch ? query : localQuery;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-2.5 size-4 text-foreground-muted"
        />
        <span className="sr-only">{searchPlaceholder}</span>
        <input
          className="h-9 w-56 rounded-md border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
          onChange={(event) =>
            onSearch ? onSearch(event.target.value) : setLocalQuery(event.target.value)
          }
          placeholder={searchPlaceholder}
          type="search"
          value={searchValue}
        />
      </label>

      {filters.map((filter) => (
        <span
          className="relative inline-flex items-center rounded-md border bg-background pl-3 pr-8"
          key={filter.label}
        >
          <select
            aria-label={filter.label}
            className="h-9 appearance-none bg-transparent text-sm text-foreground outline-none"
            onChange={(event) => onFilterChange?.(filter.label, event.target.value)}
          >
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {filter.label}: {option}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 size-4 text-foreground-muted"
          />
        </span>
      ))}

      <button
        className="text-sm font-medium text-foreground-muted hover:text-foreground"
        onClick={onReset}
        type="button"
      >
        Reset
      </button>
    </div>
  );
}
