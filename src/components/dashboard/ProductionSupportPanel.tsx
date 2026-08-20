import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LifeBuoy, TrendingUp, Users, CalendarRange } from "lucide-react";
import type { ProdSupportPersonRow, ProdSupportWeekRow } from "@/lib/report";
import { cn } from "@/lib/utils";

const fmt = (value: number | null) =>
  value === null || !Number.isFinite(value) ? "—" : value.toLocaleString();

export function ProductionSupportPanel({
  weeks,
  people,
  month,
}: {
  weeks: ProdSupportWeekRow[];
  people: ProdSupportPersonRow[];
  month?: string | undefined;
}) {
  const filteredWeeks = useMemo(
    () =>
      weeks.filter(
        (row) =>
          !month ||
          !row.month ||
          row.month.trim().toLowerCase() === month.trim().toLowerCase(),
      ),
    [weeks, month],
  );

  const totals = useMemo(() => {
    const total = filteredWeeks.reduce((sum, row) => sum + row.issueCount, 0);
    const avg = filteredWeeks.length > 0 ? total / filteredWeeks.length : null;
    const peak = filteredWeeks.reduce<ProdSupportWeekRow | null>(
      (best, row) => (!best || row.issueCount > best.issueCount ? row : best),
      null,
    );
    return { total, avg, peak };
  }, [filteredWeeks]);

  const sortedPeople = useMemo(
    () =>
      people
        .filter(
          (row) =>
            !month ||
            !row.month ||
            row.month.trim().toLowerCase() === month.trim().toLowerCase(),
        )
        .sort((a, b) => b.issueCount - a.issueCount),
    [people, month],
  );

  const peopleTotal = sortedPeople.reduce((sum, row) => sum + row.issueCount, 0);
  const topPerson = sortedPeople[0] ?? null;

  if (weeks.length === 0 && people.length === 0) return null;

  const maxWeek = Math.max(1, ...filteredWeeks.map((row) => row.issueCount));

  const metrics = [
    {
      label: "Total issues",
      value: fmt(totals.total),
      hint: month ? `Reported in ${month}` : "Across all reported weeks",
      icon: LifeBuoy,
    },
    {
      label: "Avg per week",
      value: totals.avg === null ? "—" : totals.avg.toFixed(1),
      hint: `${filteredWeeks.length} week${filteredWeeks.length === 1 ? "" : "s"} tracked`,
      icon: TrendingUp,
    },
    {
      label: "Peak week",
      value: totals.peak ? fmt(totals.peak.issueCount) : "—",
      hint: totals.peak ? `${totals.peak.week} · ${totals.peak.dateRange || "—"}` : "No weekly data",
      icon: CalendarRange,
    },
    {
      label: "Top contributor",
      value: topPerson ? fmt(topPerson.issueCount) : "—",
      hint: topPerson ? topPerson.name : "No resource data",
      icon: Users,
    },
  ];

  return (
    <section className="panel space-y-5 p-5">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Production Support
        </h3>
        <p className="text-xs text-muted-foreground">
          {month ? `Weekly issue load · ${month}` : "Weekly issue load · all months"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="flex flex-col rounded-xl border border-border/60 bg-surface/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {m.label}
              </p>
              <m.icon className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <p className="metric-figure mt-3 text-2xl font-bold">{m.value}</p>
            <p className="mt-auto pt-3 text-xs text-muted-foreground">{m.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Issues by week
          </p>
          {filteredWeeks.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No weekly rows for this period.
            </p>
          ) : (
            <>
              <div className="mt-3 h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredWeeks.map((row) => ({
                      name: row.week,
                      issues: row.issueCount,
                      range: row.dateRange,
                    }))}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                      }}
                      formatter={(value: number) => [value, "Issues"]}
                      labelFormatter={(label: string) => {
                        const match = filteredWeeks.find((row) => row.week === label);
                        return match?.dateRange ? `${label} · ${match.dateRange}` : label;
                      }}
                    />
                    <Bar dataKey="issues" radius={[6, 6, 0, 0]}>
                      {filteredWeeks.map((row) => (
                        <Cell
                          key={row.week}
                          className={
                            row.issueCount === maxWeek ? "fill-warning" : "fill-primary"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead className="bg-surface/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Week</th>
                      <th className="px-3 py-2 text-left font-medium">Date range</th>
                      <th className="px-3 py-2 text-left font-medium">Month</th>
                      <th className="px-3 py-2 text-right font-medium">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWeeks.map((row, index) => (
                      <tr key={`${row.week}-${index}`} className="border-t border-border/50">
                        <td className="px-3 py-2 font-medium">{row.week}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.dateRange || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.month || "—"}</td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          {row.issueCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-surface/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Issues by resource
          </p>
          {sortedPeople.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No resource rows in this report.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {sortedPeople.map((row) => {
                const share = peopleTotal > 0 ? (row.issueCount / peopleTotal) * 100 : 0;
                return (
                  <li key={row.name} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{row.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {row.issueCount}
                        <span className="ml-2 text-xs">{share.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full bg-primary transition-all")}
                        style={{ width: `${Math.min(100, share)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
