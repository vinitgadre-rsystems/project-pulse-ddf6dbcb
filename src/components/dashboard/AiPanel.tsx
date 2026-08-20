import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Bot, CheckCircle2, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartFrame } from "./ChartFrame";
import { formatPct, sortLabels, type AiRow } from "@/lib/report";
import { cn } from "@/lib/utils";

const ALL = "__all__";

type TeamAgg = {
  team: string;
  totalWorkItems: number;
  aiDelivered: number;
  fullyCompleted: number;
  partial: number;
  humanOnly: number;
  aiFailed: number;
  missingOutcomes: number;
  qaSum: number;
  qaCount: number;
  aiDeliveredPct: number | null;
  qaAcceptanceRate: number | null;
  fullyCompletedPct: number;
  partialPct: number;
  humanOnlyPct: number;
  aiFailedPct: number;
  missingOutcomesPct: number;
};

function aggregate(rows: AiRow[]) {
  const map = new Map<string, TeamAgg>();
  rows.forEach((row) => {
    const current =
      map.get(row.team) ??
      {
        team: row.team,
        totalWorkItems: 0,
        aiDelivered: 0,
        fullyCompleted: 0,
        partial: 0,
        humanOnly: 0,
        aiFailed: 0,
        missingOutcomes: 0,
        qaSum: 0,
        qaCount: 0,
        aiDeliveredPct: null,
        qaAcceptanceRate: null,
        fullyCompletedPct: 0,
        partialPct: 0,
        humanOnlyPct: 0,
        aiFailedPct: 0,
        missingOutcomesPct: 0,
      };
    current.totalWorkItems += row.totalWorkItems;
    current.aiDelivered += row.aiDelivered;
    current.fullyCompleted += row.fullyCompleted;
    current.partial += row.partial;
    current.humanOnly += row.humanOnly;
    current.aiFailed += row.aiFailed;
    current.missingOutcomes += row.missingOutcomes;
    if (row.qaAcceptanceRate !== null) {
      current.qaSum += row.qaAcceptanceRate;
      current.qaCount += 1;
    }
    map.set(row.team, current);
  });
  return Array.from(map.values())
    .map((entry) => {
      const total = entry.totalWorkItems;
      const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0);
      return {
        ...entry,
        aiDeliveredPct: total > 0 ? (entry.aiDelivered / total) * 100 : null,
        qaAcceptanceRate: entry.qaCount > 0 ? entry.qaSum / entry.qaCount : null,
        fullyCompletedPct: pct(entry.fullyCompleted),
        partialPct: pct(entry.partial),
        humanOnlyPct: pct(entry.humanOnly),
        aiFailedPct: pct(entry.aiFailed),
        missingOutcomesPct: pct(entry.missingOutcomes),
      };
    })
    .sort((a, b) => (b.aiDeliveredPct ?? 0) - (a.aiDeliveredPct ?? 0));
}

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  color: "var(--popover-foreground)",
  fontSize: 12,
};

const tone = (value: number | null) =>
  value === null
    ? "text-muted-foreground"
    : value < 80
      ? "text-destructive"
      : value >= 80
        ? "text-emerald-600"
        : "text-destructive";

export function AiPanel({ rows }: { rows: AiRow[] }) {
  const [team, setTeam] = useState(ALL);
  const [month, setMonth] = useState(ALL);

  const months = useMemo(
    () => sortLabels(Array.from(new Set(rows.map((r) => r.month))), "month"),
    [rows],
  );
  const teams = useMemo(
    () => Array.from(new Set(rows.map((r) => r.team))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) => (month === ALL || row.month === month) && (team === ALL || row.team === team),
      ),
    [rows, month, team],
  );

  const teamRows = useMemo(() => aggregate(filtered), [filtered]);

  if (rows.length === 0) {
    return (
      <div className="panel p-10 text-center text-sm text-muted-foreground">
        This report has no AI usage data. Upload a workbook that contains an “AI Team Summary”
        sheet with Team, Month, Total Work Items, AI Delivered Work Items, AI Delivered %,
        Fully Completed, Partial, Human Only, AI Failed, Missing Outcomes and QA Acceptance
        Rate columns.
      </div>
    );
  }

  const total = filtered.reduce((acc, r) => acc + r.totalWorkItems, 0);
  const delivered = filtered.reduce((acc, r) => acc + r.aiDelivered, 0);
  const fully = filtered.reduce((acc, r) => acc + r.fullyCompleted, 0);
  const partial = filtered.reduce((acc, r) => acc + r.partial, 0);
  const humanOnly = filtered.reduce((acc, r) => acc + r.humanOnly, 0);
  const failed = filtered.reduce((acc, r) => acc + r.aiFailed, 0);
  const missing = filtered.reduce((acc, r) => acc + r.missingOutcomes, 0);
  const qaValues = filtered
    .map((r) => r.qaAcceptanceRate)
    .filter((v): v is number => v !== null);
  const qaRate =
    qaValues.length > 0 ? qaValues.reduce((a, b) => a + b, 0) / qaValues.length : null;
  const aiDeliveredPct = total > 0 ? (delivered / total) * 100 : null;
  const failureRate = delivered > 0 ? (failed / delivered) * 100 : null;
  const humanOnlyPct = total > 0 ? (humanOnly / total) * 100 : null;

  const kpis = [
    {
      label: "AI delivered %",
      value: formatPct(aiDeliveredPct),
      icon: Sparkles,
      cls: tone(aiDeliveredPct),
    },
    {
      label: "QA acceptance rate",
      value: formatPct(qaRate),
      icon: CheckCircle2,
      cls: tone(qaRate),
    },
    {
      label: "AI failure rate",
      value: formatPct(failureRate),
      icon: AlertTriangle,
      cls: failureRate === null ? "text-muted-foreground" : tone(100 - failureRate),
    },
    {
      label: "Human-only work %",
      value: formatPct(humanOnlyPct),
      icon: Bot,
      cls: humanOnlyPct === null ? "text-muted-foreground" : tone(100 - humanOnlyPct),
    },
  ];

  const outcomePct = (value: number, total: number) =>
    total > 0 ? (value / total) * 100 : null;
  const outcomeCards = [
    { label: "Fully completed", value: outcomePct(fully, total) },
    { label: "Partial", value: outcomePct(partial, total) },
    { label: "Human only", value: outcomePct(humanOnly, total) },
    { label: "Missing outcomes", value: outcomePct(missing, total) },
  ];

  return (
    <div className="space-y-6">
      <section className="panel flex flex-wrap items-end gap-4 p-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team</p>
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All teams</SelectItem>
              {teams.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Month</p>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All months</SelectItem>
              {months.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Rows in view</p>
          <p className="metric-figure text-lg font-semibold">
            {filtered.length}
            <span className="text-sm font-normal text-muted-foreground"> / {rows.length}</span>
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {kpi.label}
              </p>
              <kpi.icon className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <p className={cn("metric-figure mt-4 text-3xl font-bold", kpi.cls)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {outcomeCards.map((item) => (
          <div key={item.label} className="panel p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className={cn("metric-figure mt-3 text-2xl font-semibold", tone(item.value))}>
              {formatPct(item.value)}
            </p>
          </div>
        ))}
      </div>

      <ChartFrame
        title="AI outcomes by team"
        description="Percentage mix of fully completed, partial, human only and failed work items."
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={teamRows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="team" {...axisProps} interval={0} angle={-15} height={50} dy={10} />
            <YAxis {...axisProps} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "var(--muted)" }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="fullyCompletedPct" name="Fully completed" stackId="a" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="partialPct" name="Partial" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="humanOnlyPct" name="Human only" stackId="a" fill="var(--chart-3)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="aiFailedPct" name="AI failed" stackId="a" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Team-wise AI summary</h3>
          <p className="text-xs text-muted-foreground">
            Aggregated across the selected months. Outcome columns are percentages of total work items.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Team</th>
                <th className="px-5 py-3 text-right font-semibold">Total work items</th>
                <th className="px-5 py-3 text-right font-semibold">AI delivered</th>
                <th className="px-5 py-3 text-right font-semibold">AI delivered %</th>
                <th className="px-5 py-3 text-right font-semibold">Fully completed %</th>
                <th className="px-5 py-3 text-right font-semibold">Partial %</th>
                <th className="px-5 py-3 text-right font-semibold">Human only %</th>
                <th className="px-5 py-3 text-right font-semibold">AI failed %</th>
                <th className="px-5 py-3 text-right font-semibold">Missing outcomes %</th>
                <th className="px-5 py-3 text-right font-semibold">QA acceptance</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map((row) => (
                <tr key={row.team} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{row.team}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.totalWorkItems}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.aiDelivered}</td>
                  <td className={cn("metric-figure px-5 py-3 text-right font-semibold", tone(row.aiDeliveredPct))}>
                    {formatPct(row.aiDeliveredPct)}
                  </td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.fullyCompletedPct)}</td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.partialPct)}</td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.humanOnlyPct)}</td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.aiFailedPct)}</td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.missingOutcomesPct)}</td>
                  <td className={cn("metric-figure px-5 py-3 text-right", tone(row.qaAcceptanceRate))}>
                    {formatPct(row.qaAcceptanceRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Monthly detail</h3>
          <p className="text-xs text-muted-foreground">
            Outcome columns are percentages of each row's total work items.
          </p>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Team</th>
                <th className="px-5 py-3 text-left font-semibold">Month</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 text-right font-semibold">AI delivered</th>
                <th className="px-5 py-3 text-right font-semibold">AI delivered %</th>
                <th className="px-5 py-3 text-right font-semibold">Fully completed %</th>
                <th className="px-5 py-3 text-right font-semibold">Partial %</th>
                <th className="px-5 py-3 text-right font-semibold">Human only %</th>
                <th className="px-5 py-3 text-right font-semibold">AI failed %</th>
                <th className="px-5 py-3 text-right font-semibold">Missing outcomes %</th>
                <th className="px-5 py-3 text-right font-semibold">QA acceptance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={`${row.team}-${row.month}-${index}`} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{row.team}</td>
                  <td className="px-5 py-3">{row.month}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.totalWorkItems}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.aiDelivered}</td>
                  <td className={cn("metric-figure px-5 py-3 text-right", tone(row.aiDeliveredPct))}>
                    {formatPct(row.aiDeliveredPct)}
                  </td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.totalWorkItems > 0 ? (row.fullyCompleted / row.totalWorkItems) * 100 : null)}</td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.totalWorkItems > 0 ? (row.partial / row.totalWorkItems) * 100 : null)}</td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.totalWorkItems > 0 ? (row.humanOnly / row.totalWorkItems) * 100 : null)}</td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.totalWorkItems > 0 ? (row.aiFailed / row.totalWorkItems) * 100 : null)}</td>
                  <td className="metric-figure px-5 py-3 text-right">{formatPct(row.totalWorkItems > 0 ? (row.missingOutcomes / row.totalWorkItems) * 100 : null)}</td>
                  <td className={cn("metric-figure px-5 py-3 text-right", tone(row.qaAcceptanceRate))}>
                    {formatPct(row.qaAcceptanceRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
