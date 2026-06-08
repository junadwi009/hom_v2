"use client";

import { useMemo, useState } from "react";

import { AiInsightPanel } from "./ai-insight-panel";
import { AlertPanel } from "./alert-panel";
import { ClassPerformanceCard } from "./class-performance-card";
import { DecisionTable } from "./decision-table";
import { InsightStrip } from "./insight-strip";
import { KpiCards } from "./kpi-cards";
import { LeadFunnelCard } from "./lead-funnel-card";
import { MemberRiskCard } from "./member-risk-card";
import { OverviewHeader } from "./overview-header";
import { RevenueMixCard } from "./revenue-mix-card";
import { TrendChart } from "./trend-chart";
import {
  buildOverviewData,
  type BranchId,
  type PeriodId,
} from "./overview-data";

export function DecisionOverviewPage() {
  const [period, setPeriod] = useState<PeriodId>("today");
  const [branch, setBranch] = useState<BranchId>("all");

  const data = useMemo(() => buildOverviewData(period, branch), [period, branch]);

  return (
    <div className="space-y-4">
      <OverviewHeader
        branch={branch}
        onBranchChange={setBranch}
        onPeriodChange={setPeriod}
        period={period}
      />

      <KpiCards cards={data.kpis} />

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <div className="lg:col-span-1 xl:col-span-5 [&>section]:h-full">
          <DecisionTable note={data.decisionTableNote} rows={data.decisionClasses} />
        </div>
        <div className="lg:col-span-1 xl:col-span-4 [&>section]:h-full">
          <TrendChart
            caption={data.trend.caption}
            series={data.trend.series}
            stats={data.trend.stats}
          />
        </div>
        <div className="lg:col-span-2 xl:col-span-3 [&>section]:h-full">
          <AlertPanel items={data.alerts} />
        </div>
      </div>

      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4 [&>section]:h-full">
        <ClassPerformanceCard data={data.classPerformance} />
        <LeadFunnelCard
          conversionRate={data.leadConversionRate}
          stages={data.leadFunnel}
        />
        <MemberRiskCard items={data.memberRisk} />
        <RevenueMixCard slices={data.revenueMix} total={data.revenueMixTotal} />
      </div>

      <AiInsightPanel
        recommendations={data.ai.recommendations}
        summary={data.ai.summary}
      />

      <InsightStrip items={data.insights} />
    </div>
  );
}
