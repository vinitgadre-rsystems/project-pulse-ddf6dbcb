import type { LucideIcon } from "lucide-react";
import {
  Bug,
  CheckCircle,
  CheckCircle2,
  ClipboardCheck,
  GitPullRequest,
  HeartPulse,
  RefreshCw,
  ShieldCheck,
  Target,
} from "lucide-react";

import { FeaturesPanel } from "./FeaturesPanel";
import type { Metrics, MilestoneRow } from "@/lib/report";
import { formatPct } from "@/lib/report";
import { cn } from "@/lib/utils";

type Kpi = {
  label: string;
  value: number | null;
  hint: string;
  icon: LucideIcon;
  successThreshold?: number;
  warningThreshold?: number;
};

type StaticKpi = {
  label: string;
  hint: string;
  target: string;
  note: string;
  icon: LucideIcon;
};

const additionalKpis: StaticKpi[] = [
  {
    label: "Self QA compliance",
    hint: "% of tickets where “Self QA checklist” is completed before handoff.",
    target: "Expected ≥90%",
    note: "Pending with Rethink",
    icon: CheckCircle,
  },
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

function tone(
  value: number | null,
  successThreshold = 90,
  warningThreshold?: number,
) {
  if (value === null) return "text-muted-foreground";
  if (value < 80) return "text-destructive";
  if (value > successThreshold) return "text-success";
  if (warningThreshold !== undefined) {
    if (value >= warningThreshold) return "text-warning";
    return "text-destructive";
  }
  if (value >= 75) return "text-primary";
  if (value >= 60) return "text-warning";
  return "text-destructive";
}

function barTone(
  value: number | null,
  successThreshold = 90,
  warningThreshold?: number,
) {
  if (value === null) return "bg-muted-foreground/30";
  if (value < 80) return "bg-destructive";
  if (value > successThreshold) return "bg-success";
  if (warningThreshold !== undefined) {
    if (value >= warningThreshold) return "bg-warning";
    return "bg-destructive";
  }
  if (value >= 75) return "bg-primary";
  if (value >= 60) return "bg-warning";
  return "bg-destructive";
}

function KpiCardContent({ kpi }: { kpi: Kpi }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {kpi.label}
        </p>
        <kpi.icon
          className={cn(
            "h-4 w-4 shrink-0",
            tone(kpi.value, kpi.successThreshold, kpi.warningThreshold),
          )}
        />
      </div>
      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
        {kpi.hint}
      </p>
      <div className="mt-auto pt-4">
        <p
          className={cn(
            "metric-figure text-2xl font-bold",
            tone(kpi.value, kpi.successThreshold, kpi.warningThreshold),
          )}
        >
          {formatPct(kpi.value)}
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barTone(kpi.value, kpi.successThreshold, kpi.warningThreshold))}
          style={{ width: `${Math.min(100, Math.max(0, kpi.value ?? 0))}%` }}
        />
      </div>
    </>
  );
}

function StaticKpiCard({ kpi }: { kpi: StaticKpi }) {
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
        <p className="text-xs leading-relaxed text-muted-foreground">
          {kpi.target}
        </p>
      </div>
      {kpi.note ? (
        <p className="mt-2 text-xs font-medium text-destructive">{kpi.note}</p>
      ) : null}
    </div>
  );
}

export function KpiCards({
  metrics,
  milestones,
  month,
  team,
}: {
  metrics: Metrics;
  baseline?: Metrics;
  milestones?: MilestoneRow[] | undefined;
  month?: string | undefined;
  team?: string | undefined;
}) {
  const isBh = (team ?? "").trim().toLowerCase() === "bh";
  const staticKpis: StaticKpi[] = additionalKpis.map((kpi) =>
    kpi.label === "Automation coverage" && !isBh ? { ...kpi, note: "" } : kpi,
  );
  const kpis: Kpi[] = [
    {
      label: "Health score",
      value: metrics.healthScore,
      hint: "Average of readiness, completed to committed and hygiene scores.",
      icon: HeartPulse,
    },
    {
      label: "Ticket readiness compliance",
      value: metrics.readinessPct,
      hint: "% of tickets where “Readiness checklist” is completed before start. Expected ≥ 90 %",
      icon: ClipboardCheck,
    },
    {
      label: "Completed to committed",
      value: metrics.completionPct,
      hint: `${metrics.completed} of ${metrics.committed} committed.\n% of story points committed vs completed within sprint Expected ≥80%`,
      icon: Target,
      successThreshold: 80,
      warningThreshold: 70,
    },
    {
      label: "Process hygiene (QA)",
      value: metrics.hygienePct,
      hint: "Formula: Process hygiene / total ticket count.\nTest cases must be linked to every user story/Epic\nin the sprint with accurate status and test results Expected ≥97%",
      icon: CheckCircle2,
      successThreshold: 97,
      warningThreshold: 80,
    },
  ];

  const [health, ...rest] = kpis;
  if (!health) return null;

  const rethinkSla = rest;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="panel flex h-full flex-col justify-between p-5">
          <div className="flex flex-1 flex-col justify-center gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {health.label}
                </p>
                <health.icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    tone(health.value, health.successThreshold, health.warningThreshold),
                  )}
                />
              </div>
              <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {health.hint}
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p
                  className={cn(
                    "metric-figure text-3xl font-bold",
                    tone(health.value, health.successThreshold, health.warningThreshold),
                  )}
                >
                  {formatPct(health.value)}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-2/5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    barTone(health.value, health.successThreshold, health.warningThreshold),
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, health.value ?? 0))}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                Combines readiness, completion and hygiene
              </p>
            </div>
          </div>
          <div className="mt-2 w-full border-t border-border/50 pt-2">
            <p className="text-xs text-success font-medium">
              ✅ DoD Achieved: Development complete and QA successfully validated
            </p>
          </div>
        </div>

        <FeaturesPanel milestones={milestones} month={month} />
      </div>

      <section className="panel flex flex-col p-5">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground">
          Rethink SLAs
        </h3>
        <div className="sla-agreed rounded-lg border p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">Agreed SLAs</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rethinkSla.map((kpi) => (
              <div
                key={kpi.label}
                className="flex h-full flex-col rounded-lg border border-border/60 bg-surface/40 p-4"
              >
                <KpiCardContent kpi={kpi} />
              </div>
            ))}
          </div>
        </div>
        <div className="sla-dependency mt-4 rounded-lg border p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">Can not be tracked - Rethink Dependencies</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {additionalKpis.map((kpi) => (
              <StaticKpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
