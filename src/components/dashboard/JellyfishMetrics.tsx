import type { LucideIcon } from "lucide-react";
import { CalendarCheck, GitCommitHorizontal, GitPullRequest } from "lucide-react";

import type { Metrics } from "@/lib/report";
import { formatNumber } from "@/lib/report";
import { cn } from "@/lib/utils";

type Kpi = {
  label: string;
  value: number | null;
  hint: string;
  icon: LucideIcon;
  average?: number | null;
};

function KpiCardContent({ kpi }: { kpi: Kpi }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {kpi.label}
        </p>
        <kpi.icon className="h-4 w-4 shrink-0 text-primary" />
      </div>
      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
        {kpi.hint}
        {kpi.average !== null && kpi.average !== undefined ? (
          <span className="ml-1 font-medium text-foreground/70">
            · Avg {formatNumber(kpi.average)}
          </span>
        ) : null}
      </p>
      <div className="mt-auto pt-4">
        <p className="metric-figure text-2xl font-bold text-foreground">
          {formatNumber(kpi.value)}
        </p>
      </div>
    </>
  );
}

export function JellyfishMetrics({
  metrics,
  baseline,
}: {
  metrics: Metrics;
  baseline?: Metrics;
}) {
  const base = baseline ?? metrics;

  const kpis: Kpi[] = [
    {
      label: "Total commits",
      value: metrics.avgCommits,
      hint: "Average per dev / week\n(Per Developer/Per week)\nIndustry Benchmark: 7-15",
      icon: GitCommitHorizontal,
      average: base.avgCommits,
    },
    {
      label: "Days with commits",
      value: metrics.avgDaysWithCommits,
      hint: "Average active days per dev / week\n(Per Developer/Per week)\nIndustry Benchmark: 2-5",
      icon: CalendarCheck,
      average: base.avgDaysWithCommits,
    },
    {
      label: "PRs Created",
      value: metrics.avgPrsCreated,
      hint: "Average per dev / week\n(Per Developer/Per week)\nIndustry Benchmark: 1-2",
      icon: GitPullRequest,
      average: base.avgPrsCreated,
    },
  ];

  return (
    <div className="space-y-3">
      <section className="panel p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Jellyfish Metrics
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex h-full flex-col rounded-lg border border-border/60 bg-surface/40 p-4"
            >
              <KpiCardContent kpi={kpi} />
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs italic text-muted-foreground">
        All of the metric expressed in per dev/week
      </p>
    </div>
  );
}
