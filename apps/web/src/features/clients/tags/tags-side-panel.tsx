import { Sparkles } from "lucide-react";

import { DemoButton, DemoLink } from "@/features/shell/demo-action";

import { ClientDonut } from "../shared/clients-donut";
import {
  tagOverviewSlices,
  tagsAiInsight,
  topTagsByClient,
} from "./tags-data";

export function TagsSidePanel() {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-sm font-semibold text-foreground">Tag Overview</h2>
        <div className="mt-3 flex items-center gap-4">
          <ClientDonut
            centerTop="Client Bertag"
            centerValue="1.024"
            slices={tagOverviewSlices}
          />
          <ul className="flex-1 space-y-1 text-xs">
            {tagOverviewSlices.map((slice) => (
              <li className="flex items-center gap-2" key={slice.label}>
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="flex-1 text-foreground-muted">{slice.label}</span>
                <span className="font-medium text-foreground">{slice.pct}</span>
              </li>
            ))}
          </ul>
        </div>
        <DemoLink
          className="mt-3 text-xs font-medium text-amber-800 hover:underline"
          message="Membuka laporan distribusi tag (demo)."
        >
          Lihat detail laporan →
        </DemoLink>
      </section>

      <section className="rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Top Tags by Client</h2>
          <DemoLink
            className="text-xs font-medium text-amber-800 hover:underline"
            message="Menampilkan semua tag (demo)."
          >
            Lihat semua
          </DemoLink>
        </div>
        <ol className="space-y-2">
          {topTagsByClient.map((tag, index) => (
            <li className="flex items-center gap-3 text-sm" key={tag.name}>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-600">
                {index + 1}
              </span>
              <span className="flex-1 text-foreground">{tag.name}</span>
              <span className="text-foreground-muted">
                {tag.count}{" "}
                <span className="text-xs">client ({tag.pct})</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-accent-gold-muted bg-accent-gold-muted/30 p-5 shadow-[var(--shadow-soft)]">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkles aria-hidden="true" className="size-4 text-amber-700" />
          AI Insight
        </p>
        <p className="mt-1 text-xs leading-5 text-foreground-muted">{tagsAiInsight}</p>
        <DemoButton
          className="mt-3 w-full"
          message="Membuka pengelolaan tag (gabung/hapus/rapikan) — demo."
          size="sm"
          type="button"
        >
          Kelola Tag
        </DemoButton>
      </section>
    </div>
  );
}
