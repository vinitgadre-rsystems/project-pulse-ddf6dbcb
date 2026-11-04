import { Bot, ClipboardCheck, ListChecks, Users } from "lucide-react";
import type { FixFactoryData, FixFactoryMetric } from "@/lib/report";
import { cn } from "@/lib/utils";

const fmtNum = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "—" : value.toLocaleString();

const fmtShare = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${Math.round(value <= 1 ? value * 100 : value)}%`;
};

const pctFrom = (result: string): number | null => {
  const match = result.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
};

const tone = (value: number | null) => {
  if (value === null) return "text-muted-foreground";
  if (value >= 80) return "text-success";
  if (value >= 50) return "text-warning";
  return "text-destructive";
};

const barTone = (value: number | null) => {
  if (value === null) return "bg-muted-foreground/30";
  if (value >= 80) return "bg-success";
  if (value >= 50) return "bg-warning";
  return "bg-destructive";
};

function MetricCard({ metric }: { metric: FixFactoryMetric }) {
  const pct = pctFrom(metric.result);
  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-surface/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {metric.label}
      </p>
      <p className={cn("metric-figure mt-3 text-2xl font-bold", tone(pct))}>
        {metric.result || "—"}
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barTone(pct))}
          style={{ width: `${Math.min(100, Math.max(0, pct ?? 0))}%` }}
        />
      </div>
    </div>
  );
}

function SubPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      {children}
    </div>
  );
}

export function FixFactoryPanel({ data }: { data?: FixFactoryData | null }) {
  if (!data) return null;

  const hasAny =
    data.headline.length > 0 ||
    data.diagnosis.length > 0 ||
    data.population.length > 0 ||
    data.effectiveness.length > 0 ||
    data.stressTests.length > 0 ||
    data.agentSteps.length > 0 ||
    data.methodology.length > 0;
  if (!hasAny) return null;

  const cards = [...data.headline, ...data.diagnosis].filter(
    (metric) => !/application code usable without rework/i.test(metric.label),
  );

  return (
    <section className="panel space-y-5 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Fix Factory
          </h3>
          <p className="text-xs text-muted-foreground">
            AI fix-factory agent performance, parsed from the workbook’s Fix Factory tab.
          </p>
        </div>
        <Bot className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
      </div>

      {cards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((metric, index) => (
            <MetricCard key={`${metric.label}-${index}`} metric={metric} />
          ))}
        </div>
      ) : null}

      {data.agentSteps.length > 0 || data.methodology.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.agentSteps.length > 0 ? (
            <SubPanel title="What the agent does">
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-foreground">
                {data.agentSteps.map((step, index) => (
                  <li key={`step-${index}`}>{step}</li>
                ))}
              </ul>
            </SubPanel>
          ) : null}
          {data.methodology.length > 0 ? (
            <SubPanel title="Methodology">
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-foreground">
                {data.methodology.map((step, index) => (
                  <li key={`method-${index}`}>{step}</li>
                ))}
              </ul>
            </SubPanel>
          ) : null}
        </div>
      ) : null}

      {data.population.length > 0 ? (
        <SubPanel title="Evaluation population">
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 text-left font-medium">Evaluation stage</th>
                  <th className="py-2 text-right font-medium">Tickets</th>
                </tr>
              </thead>
              <tbody>
                {data.population.map((row, index) => (
                  <tr key={`pop-${index}`} className="border-t border-border/50">
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                        {row.stage}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">{fmtNum(row.tickets)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubPanel>
      ) : null}

      {data.effectiveness.length > 0 ? (
        <SubPanel title="Recommendation effectiveness">
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 text-left font-medium">Suggestion type</th>
                  <th className="py-2 px-3 text-right font-medium">Tickets reviewed</th>
                  <th className="py-2 px-3 text-right font-medium">Used as-is</th>
                  <th className="py-2 px-3 text-right font-medium">Used after rework</th>
                  <th className="py-2 px-3 text-right font-medium">Rejected</th>
                  <th className="py-2 text-right font-medium">Useful overall</th>
                </tr>
              </thead>
              <tbody>
                {data.effectiveness.map((row, index) => (
                  <tr key={`eff-${index}`} className="border-t border-border/50">
                    <td className="py-2 pr-4 font-medium">{row.type}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{fmtNum(row.reviewed)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{fmtNum(row.usedAsIs)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {fmtNum(row.usedAfterRework)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{fmtNum(row.rejected)}</td>
                    <td
                      className={cn(
                        "py-2 text-right font-semibold tabular-nums",
                        tone(row.usefulOverall === null ? null : row.usefulOverall <= 1 ? row.usefulOverall * 100 : row.usefulOverall),
                      )}
                    >
                      {fmtShare(row.usefulOverall)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubPanel>
      ) : null}

      {/* Stress-test results hidden per request */}



      {data.population.length > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {fmtNum(data.population[0]?.tickets ?? null)} parent bugs analysed by the agent in this
          evaluation.
          <ClipboardCheck className="ml-2 h-3.5 w-3.5" />
          Graded with an LLM-as-judge rubric and cross-validated against pull requests.
        </p>
      ) : null}
    </section>
  );
}
