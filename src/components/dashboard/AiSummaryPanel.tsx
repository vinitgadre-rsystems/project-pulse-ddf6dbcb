import { useMemo } from "react";
import { Bot, Sparkles, Tickets } from "lucide-react";
import type { AiAgentRow, AiResourceRow } from "@/lib/report";
import { cn } from "@/lib/utils";

const fmtPct = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "—" : `${value.toFixed(0)}%`;

const fmtNum = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString() : "—";

const monthKey = (value: string) => value.trim().toLowerCase();

function tone(value: number | null, thresholds: { success: number; warning: number }) {
  if (value === null) return "text-muted-foreground";
  if (value < 80) return "text-destructive";
  if (value > thresholds.success) return "text-success";
  if (value >= thresholds.warning) return "text-warning";
  return "text-destructive";
}

function barTone(value: number | null, thresholds: { success: number; warning: number }) {
  if (value === null) return "bg-muted-foreground/30";
  if (value < 80) return "bg-destructive";
  if (value > thresholds.success) return "bg-success";
  if (value >= thresholds.warning) return "bg-warning";
  return "bg-destructive";
}

export function AiSummaryPanel({
  rows,
  agents = [],
  month,
}: {
  rows: AiResourceRow[];
  agents?: AiAgentRow[];
  month?: string | undefined;
}) {
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const monthOk = !month || monthKey(row.month) === monthKey(month);
        return monthOk;
      }),
    [rows, month],
  );

  const teams = useMemo(() => {
    const map = new Map<string, { team: string; withAi: number; total: number }>();
    filtered.forEach((row) => {
      const key = row.team || "Unspecified";
      const entry = map.get(key) ?? { team: key, withAi: 0, total: 0 };
      entry.withAi += row.ticketsWithAi;
      entry.total += row.totalTickets;
      map.set(key, entry);
    });
    return [...map.values()].map((entry) => ({
      ...entry,
      usage: entry.total > 0 ? (entry.withAi / entry.total) * 100 : null,
    }));
  }, [filtered]);

  const totals = teams.reduce(
    (acc, entry) => ({ withAi: acc.withAi + entry.withAi, total: acc.total + entry.total }),
    { withAi: 0, total: 0 },
  );
  const overall = totals.total > 0 ? (totals.withAi / totals.total) * 100 : null;

  const agentNames = useMemo(() => {
    const set = new Set<string>();
    agents
      .filter((row) => !month || monthKey(row.month) === monthKey(month) || monthKey(row.month) === "unspecified")
      .forEach((row) => set.add(row.agent.trim()));
    return [...set];
  }, [agents, month]);

  const detail = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const monthCompare = a.month.localeCompare(b.month);
        if (monthCompare !== 0) return monthCompare;
        return (b.aiUsagePct ?? -1) - (a.aiUsagePct ?? -1);
      }),
    [filtered],
  );

  if (rows.length === 0) return null;

  const thresholds = { success: 60, warning: 30 };

  const metrics = [
    {
      label: "AI usage",
      value: overall,
      kind: "pct" as const,
      icon: Bot,
      hint: "AI-assisted tickets / total tickets",
    },
    {
      label: "Tickets with AI",
      value: totals.total > 0 ? (totals.withAi / totals.total) * 100 : null,
      display: `${fmtNum(totals.withAi)} / ${fmtNum(totals.total)}`,
      kind: "ratio" as const,
      icon: Tickets,
      hint: "Tickets assisted by AI vs total tickets",
    },
  ];

  return (
    <section className="panel space-y-5 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            AI Summary
          </h3>
          <p className="text-xs text-muted-foreground">
            {month ? `All teams · ${month}` : "All teams · all months"}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border/60 bg-surface/40 p-6 text-center text-sm text-muted-foreground">
          No AI resource usage rows match the selected filters.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col rounded-xl border border-border/60 bg-surface/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {m.label}
                  </p>
                  <m.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      m.kind === "pct" ? tone(m.value, thresholds) : "text-primary",
                    )}
                  />
                </div>
                <div className="mt-3">
                  <p
                    className={cn(
                      "metric-figure text-2xl font-bold",
                      tone(m.value, thresholds),
                    )}
                  >
                    {m.kind === "ratio" ? m.display : fmtPct(m.value)}
                  </p>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      barTone(m.value, thresholds),
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, m.value ?? 0))}%` }}
                  />
                </div>
                <p className="mt-auto pt-3 text-xs text-muted-foreground">{m.hint}</p>
              </div>
            ))}

            <div className="flex flex-col rounded-xl border border-border/60 bg-surface/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  AI agents used
                </p>
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <div className="mt-3 min-h-[3.5rem]">
                {agentNames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No AI agents listed for this period</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
                    {agentNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-auto pt-3 text-xs text-muted-foreground">Agents used across teams</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Resource</th>
                  <th className="px-3 py-2 text-left font-medium">Team</th>
                  <th className="px-3 py-2 text-left font-medium">Month</th>
                  <th className="px-3 py-2 text-right font-medium">Tickets with AI</th>
                  <th className="px-3 py-2 text-right font-medium">Total tickets</th>
                  <th className="px-3 py-2 text-right font-medium">AI usage %</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((row, index) => (
                  <tr
                    key={`${row.team}-${row.resource}-${row.month}-${index}`}
                    className="border-t border-border/50"
                  >
                    <td className="px-3 py-2 font-medium">{row.resource}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.team || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.month}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.ticketsWithAi}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.totalTickets}</td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-semibold tabular-nums",
                        tone(row.aiUsagePct, thresholds),
                      )}
                    >
                      {fmtPct(row.aiUsagePct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
