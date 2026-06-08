import { ChevronDown, Sparkles, SlidersHorizontal } from "lucide-react";

import { DemoButton, DemoLink } from "@/features/shell/demo-action";

import { serviceAiInsight, serviceFilters } from "./service-catalog-data";

export function ServiceFilterPanel() {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Filter Cepat</h2>
          <DemoLink
            className="text-xs font-medium text-amber-800 hover:underline"
            message="Filter direset (demo)."
          >
            Reset
          </DemoLink>
        </div>
        <div className="space-y-3">
          {serviceFilters.map((filter) => (
            <FilterField
              key={filter.label}
              label={filter.label}
              options={filter.options}
            />
          ))}
          <DemoButton
            className="w-full justify-between"
            message="Advanced Filter dibuka (demo)."
            size="sm"
            type="button"
            variant="secondary"
          >
            Advanced Filter
            <SlidersHorizontal aria-hidden="true" className="size-4" />
          </DemoButton>
        </div>
      </section>

      <section className="rounded-lg border border-accent-gold-muted bg-accent-gold-muted/30 p-5 shadow-[var(--shadow-soft)]">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
          AI Insight
        </p>
        <ul className="mt-2 space-y-1.5 text-xs leading-5 text-foreground-muted">
          {serviceAiInsight.map((insight) => (
            <li className="flex items-start gap-1.5" key={insight}>
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-600" />
              {insight}
            </li>
          ))}
        </ul>
        <DemoButton
          className="mt-3 w-full"
          message="Membuka rekomendasi AI untuk produk (demo)."
          size="sm"
          type="button"
        >
          Lihat Rekomendasi →
        </DemoButton>
      </section>

      <section className="rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
        <p className="text-sm font-semibold text-foreground">Butuh bantuan?</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Tanya AI Assistant untuk rekomendasi paket atau strategi harga.
        </p>
      </section>
    </div>
  );
}

function FilterField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-foreground-muted">{label}</span>
      <span className="relative block">
        <select
          aria-label={label}
          className="h-9 w-full appearance-none rounded-md border bg-background pl-3 pr-8 text-sm text-foreground outline-none focus:border-accent-gold focus:ring-2 focus:ring-accent-gold-muted"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-foreground-muted"
        />
      </span>
    </label>
  );
}
