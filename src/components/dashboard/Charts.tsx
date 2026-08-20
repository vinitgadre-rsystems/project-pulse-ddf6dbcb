import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame } from "./ChartFrame";
import type { ReportRow } from "@/lib/report";
import { computeMetrics, groupBy, sortLabels } from "@/lib/report";

export const SERIES = [
  { key: "readinessPct", name: "Ticket readiness %", color: "var(--chart-1)" },
  { key: "completionPct", name: "Completed / committed %", color: "var(--chart-3)" },
  { key: "hygienePct", name: "Process hygiene %", color: "var(--chart-4)" },
] as const;

type Point = Record<string, string | number | null>;

function buildSeries(rows: ReportRow[], key: "team" | "sprint" | "month"): Point[] {
  const groups = groupBy(rows, key);
  const order = sortLabels(
    groups.map((g) => g.label),
    key === "month" ? "month" : "sprint",
  );
  const byLabel = new Map(groups.map((g) => [g.label, g.metrics]));
  return order.map((label) => {
    const metrics = byLabel.get(label)!;
    return {
      label,
      readinessPct: metrics.readinessPct,
      completionPct: metrics.completionPct,
      hygienePct: metrics.hygienePct,
      healthScore: metrics.healthScore,
    };
  });
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

const fmt = (value: unknown) =>
  typeof value === "number" ? `${value.toFixed(1)}%` : "n/a";


export function TrendChart({
  rows,
  dimension,
}: {
  rows: ReportRow[];
  dimension: "sprint" | "month";
}) {
  const data = buildSeries(rows, dimension);
  return (
    <ChartFrame
      title={dimension === "sprint" ? "Sprint-wise trend" : "Month-wise trend"}
      description={
        dimension === "sprint"
          ? "How compliance and delivery move sprint over sprint."
          : "Longer-range monthly view of project health."
      }
      height={320}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis domain={[0, 100]} unit="%" {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} formatter={fmt} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {SERIES.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.name}
              stroke={series.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function VelocityChart({
  rows,
  dimension,
}: {
  rows: ReportRow[];
  dimension: "sprint" | "month";
}) {
  const groups = groupBy(rows, dimension);
  const order = sortLabels(
    groups.map((g) => g.label),
    dimension === "month" ? "month" : "sprint",
  );
  const byLabel = new Map(groups.map((g) => [g.label, g.metrics]));
  const data = order.map((label) => {
    const m = byLabel.get(label)!;
    return {
      label,
      committed: m.committed,
      completed: m.completed,
      completionPct: m.completionPct,
    };
  });

  const avg =
    data.length > 0
      ? data.reduce((a, d) => a + d.completed, 0) / data.length
      : 0;

  return (
    <ChartFrame
      title="Velocity"
      description={`Story points committed vs completed per ${dimension}. Average completed: ${avg.toFixed(
        1,
      )}`}
      height={340}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 24, left: 24, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...axisProps}>
            <Label
              value={dimension === "sprint" ? "Sprint" : "Month"}
              position="insideBottom"
              offset={-10}
              fill="var(--muted-foreground)"
              fontSize={12}
              fontWeight={500}
            />
          </XAxis>
          <YAxis yAxisId="left" {...axisProps}>
            <Label
              value="Story points"
              angle={-90}
              position="insideLeft"
              fill="var(--muted-foreground)"
              fontSize={12}
              fontWeight={500}
            />
          </YAxis>
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            unit="%"
            {...axisProps}
          >
            <Label
              value="Completion %"
              angle={90}
              position="insideRight"
              fill="var(--muted-foreground)"
              fontSize={12}
              fontWeight={500}
            />
          </YAxis>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: unknown, name: unknown) =>
              name === "Completion %" ? fmt(value) : String(value)
            }
            cursor={{ fill: "var(--muted)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            yAxisId="left"
            dataKey="committed"
            name="Committed"
            fill="var(--chart-2)"
            radius={[4, 4, 0, 0]}
            maxBarSize={26}
          />
          <Bar
            yAxisId="left"
            dataKey="completed"
            name="Completed"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={26}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="completionPct"
            name="Completion %"
            stroke="var(--chart-4)"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <ReferenceLine
            yAxisId="left"
            y={avg}
            stroke="var(--chart-5)"
            strokeDasharray="6 4"
            label={{
              value: `Avg completed: ${avg.toFixed(1)}`,
              position: "top",
              fill: "var(--chart-5)",
              fontSize: 12,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

