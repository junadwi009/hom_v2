import { Sparkles } from "lucide-react";

import { DemoButton } from "@/features/shell/demo-action";

import { AiAskInput } from "./ai-ask-input";
import type { AiRecommendation } from "./overview-data";

export function AiInsightPanel({
  summary,
  recommendations,
}: {
  summary: string;
  recommendations: AiRecommendation[];
}) {
  return (
    <section className="rounded-lg border bg-background-card p-5 shadow-[var(--shadow-soft)]">
      <header className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-accent-gold-muted text-amber-900">
          <Sparkles aria-hidden="true" className="size-4" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">
          AI Insight &amp; Rekomendasi
        </h2>
      </header>

      <div className="mt-4 grid gap-5 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-1">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Ringkasan Hari Ini
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              {summary}
            </p>
          </div>
          <AiAskInput />
        </div>

        <div className="lg:col-span-3">
          <p className="text-sm font-semibold text-foreground">
            Top 3 Rekomendasi Prioritas
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((rec, index) => (
              <article
                className="flex flex-col rounded-md border bg-background p-3"
                key={rec.title}
              >
                <div className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-gold-muted text-xs font-semibold text-amber-900">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {rec.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-foreground-muted">
                      {rec.detail}
                    </p>
                    {rec.potential ? (
                      <p className="mt-1 text-xs font-medium text-green-700">
                        {rec.potential}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <DemoButton
                    message={`${rec.action} (demo).`}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {rec.action}
                  </DemoButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
