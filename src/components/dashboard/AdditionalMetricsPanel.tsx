import type { LucideIcon } from "lucide-react";
import { Bug, GitPullRequest, RefreshCw, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type StaticKpi = {
  label: string;
  hint: string;
  target: string;
  note: string;
  icon: LucideIcon;
};

const kpis: StaticKpi[] = [
  {
    label: "Reopened rate",
    hint: "% of QA returns\nFormula (Reopened / Tested) × 100%",
    target: "Expected ≤20%",
    note: "Pending with Rethink",
    icon: RefreshCw,
  },
  {
    label: "Code review iteration",
    hint: "Average number of review cycles before merge",
    target: "Expected ≤2",
    note: "Pending with Rethink",
    icon: GitPullRequest,
  },
  {
    label: "Defect detection",
    hint: "% of defects identified in lower environments, with <11% escaping to production",
    target: "Expected ≥95%",
    note: "Pending with Rethink",
    icon: Bug,
  },
  {
    label: "Automation coverage",
    hint: "% of the automatable regression test suite that is automated",
    target: "Expected ≥85%",
    note: "N/A for RSI team as team has been asked not to work on automation",
    icon: ShieldCheck,
  },
];

function KpiCard({ kpi }: { kpi: StaticKpi }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border/60 bg-surface/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {kpi.label}
        </p>
        <kpi.icon className="h-4 w-4 shrink-0 text-primary" />
      </div>
      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
        {kpi.hint}
      </p>
      <div className="mt-auto pt-4">
        <p className={cn("metric-figure text-2xl font-bold text-foreground")}>
          {kpi.target}
        </p>
      </div>
      <p className="mt-2 text-xs font-medium text-destructive">{kpi.note}</p>
    </div>
  );
}

export function AdditionalMetricsPanel() {
  return (
    <section className="panel p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Additional Metrics
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </div>
    </section>
  );
}
