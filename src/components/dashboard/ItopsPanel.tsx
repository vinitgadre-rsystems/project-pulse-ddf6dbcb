import { useMemo, useState, type ComponentType } from "react";
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
import { CheckCircle2, Clock, Cog, Gauge, Headset, Shield, Ticket } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartFrame } from "./ChartFrame";
import { formatPct, sortLabels, type ItopsRow, type ItopsServicesTable } from "@/lib/report";
import { cn } from "@/lib/utils";

type SlaMetric = {
  label: string;
  hint: string;
  target: string;
  note: string;
  icon: ComponentType<{ className?: string }>;
};

const securityMetrics: SlaMetric[] = [
  {
    label: "MTTA P1 Incident Response (IST)",
    hint: "Time from ticket creation to analyst acknowledgement during IST coverage",
    target: "Expected 15 min",
    note: "**Pending with Rethink",
    icon: Shield,
  },
  {
    label: "MTTA P1 Incident Response (Off-Hours)",
    hint: "Time from ticket creation to on-call escalation (if on-call is implemented)",
    target: "Expected 30 min",
    note: "**Pending with Rethink",
    icon: Shield,
  },
  {
    label: "MTTA P2 Incident Response (IST)",
    hint: "Time from ticket creation to analyst acknowledgement during IST coverage",
    target: "Expected 45 min",
    note: "**Pending with Rethink",
    icon: Shield,
  },
  {
    label: "MTTA P3 Incident Response (IST)",
    hint: "Time from ticket creation to analyst acknowledgement during IST coverage",
    target: "Expected 8 business hours",
    note: "**Pending with Rethink",
    icon: Shield,
  },
  {
    label: "MTTA P4 Alert Review",
    hint: "Initial review of low-risk alerts",
    target: "Expected 1 business day",
    note: "**Pending with Rethink",
    icon: Shield,
  },
  {
    label: "MTTR P1 Incident Containment",
    hint: "Time to isolate affected asset, block IOC, or stop active threat",
    target: "Expected 4 hours",
    note: "**Pending with Rethink",
    icon: Shield,
  },
];

const devopsMetrics: SlaMetric[] = [
  {
    label: "Infrastructure-as-code",
    hint: "Newly created or modified resources must be deployed via Infrastructure as Code (Terraform).",
    target: "Expected: Any manual changes remediated within 2 business days",
    note: "",
    icon: Cog,
  },
  {
    label: "CI/CD pipeline",
    hint: "Maintain fully automated build/test/deploy pipelines. Pipelines must include automated testing, linting, security scanning, and deployment gating.",
    target: "Expected: Failed pipelines must be diagnosed and fixed within 1 business day",
    note: "**Pending with Rethink",
    icon: Cog,
  },
  {
    label: "Change Management",
    hint: "All deployments (infra or app) must follow defined change-management workflows, including PR review, documentation of changes, and approval gating.",
    target: "Expected: 100% of production changes must go through approved change-management workflow",
    note: "**Pending with Rethink",
    icon: Cog,
  },
  {
    label: "Documentation",
    hint: "All pipelines, IaC modules, architectural changes, and operational runbooks must be documented and updated continuously.",
    target: "Expected: Documentation must be centralized in Confluence",
    note: "**Pending with Rethink",
    icon: Cog,
  },
  {
    label: "Monitoring",
    hint: "Maintain monitoring dashboards and alerting for Azure infrastructure, pipelines, and deployments.",
    target: "Expected: Critical pipeline or infrastructure incidents acknowledged within 2 hours (during working hours). Resolved in 2 business days",
    note: "**Pending with Rethink",
    icon: Cog,
  },
];

const helpdeskMetrics: SlaMetric[] = [
  {
    label: "P1 Incident Response",
    hint: "The difference between the time an incident ticket is submitted and the time a member accepts for resolution.",
    target: "Expected: 15 min",
    note: "**Pending with Rethink",
    icon: Headset,
  },
  {
    label: "P1 Incident Resolution",
    hint: "The difference between the time the member accepts a ticket for resolution and the time the ticket resolves the incident or provides a workaround.",
    target: "Expected: 4 hours",
    note: "**Pending with Rethink",
    icon: Headset,
  },
  {
    label: "P2 Incident Response",
    hint: "The difference between the time an incident ticket is submitted and the time a member accepts for resolution.",
    target: "Expected: 60 min",
    note: "**Pending with Rethink",
    icon: Headset,
  },
  {
    label: "P2 Incident Resolution",
    hint: "The difference between the time the member accepts a ticket for resolution and the time the ticket resolves the incident or provides a workaround.",
    target: "Expected: 3 business days",
    note: "**Pending with Rethink",
    icon: Headset,
  },
  {
    label: "P3 Incident Response",
    hint: "The difference between the time an incident ticket is submitted and the time a member accepts for resolution.",
    target: "Expected: 4 Business hours",
    note: "**Pending with Rethink",
    icon: Headset,
  },
  {
    label: "P3 Incident Resolution",
    hint: "The difference between the time the member accepts a ticket for resolution and the time the ticket resolves the incident or provides a workaround.",
    target: "Expected: 5 Business days",
    note: "**Pending with Rethink",
    icon: Headset,
  },
  {
    label: "P4 Incident Response",
    hint: "The difference between the time an incident ticket is submitted and the time a member accepts for resolution.",
    target: "Expected: 8 Business hours",
    note: "**Pending with Rethink",
    icon: Headset,
  },
];

function SlaMetricCard({ metric }: { metric: SlaMetric }) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border/60 bg-surface/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {metric.label}
        </p>
        <metric.icon className="h-4 w-4 shrink-0 text-primary" />
      </div>
      <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
        {metric.hint}
      </p>
      <div className="mt-auto pt-4">
        <p className="text-xs leading-relaxed text-muted-foreground">{metric.target}</p>
      </div>
      {metric.note ? (
        <p className="mt-2 text-xs font-medium text-destructive">{metric.note}</p>
      ) : null}
    </div>
  );
}



const ALL = "__all__";

type TeamAgg = {
  team: string;
  baseline: string;
  assigned: number;
  closed: number;
  pending: number;
  closureRate: number | null;
};

function aggregate(rows: ItopsRow[]): TeamAgg[] {
  const map = new Map<string, TeamAgg>();
  rows.forEach((row) => {
    const current =
      map.get(row.team) ??
      { team: row.team, baseline: row.baseline, assigned: 0, closed: 0, pending: 0, closureRate: null };
    current.assigned += row.assigned;
    current.closed += row.closed;
    current.pending += row.pending;
    if (!current.baseline && row.baseline) current.baseline = row.baseline;
    map.set(row.team, current);
  });
  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      closureRate: entry.assigned > 0 ? (entry.closed / entry.assigned) * 100 : null,
    }))
    .sort((a, b) => (b.closureRate ?? 0) - (a.closureRate ?? 0));
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
      : value >= 95
        ? "text-emerald-600"
        : value >= 85
          ? "text-amber-600"
          : "text-destructive";

function ServicesIntro({ services }: { services?: ItopsServicesTable | null | undefined }) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold">ITOps Services</h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          Rethink’s Technology Support Portfolio spans 8 critical service areas, supported by 15 resources,
          providing end-to-end coverage across IT operations, cloud/platform engineering, security, product
          support, data, and business applications.
        </p>
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <span className="font-semibold text-foreground">Technology & Infrastructure:</span>{" "}
            Office 365, DevOps, SecOps
          </div>
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <span className="font-semibold text-foreground">Business Applications:</span>{" "}
            Gainsight, Salesforce
          </div>
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <span className="font-semibold text-foreground">Product & Experience:</span>{" "}
            UI/UX, Vizzle & ED Product Support
          </div>
          <div className="rounded-md bg-muted/50 px-3 py-2">
            <span className="font-semibold text-foreground">Data & Analytics:</span>{" "}
            Power BI & EDW
          </div>
        </div>
      </div>
      {services && services.rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {services.headers.map((header, index) => (
                  <th
                    key={`${header}-${index}`}
                    className={cn(
                      "px-5 py-3 font-semibold",
                      index === 0 ? "text-left" : "text-left",
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-border align-top">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "px-5 py-3",
                        cellIndex === 0 ? "font-medium" : "text-muted-foreground",
                      )}
                    >
                      {cell || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export function ItopsPanel({
  rows,
  services,
}: {
  rows: ItopsRow[];
  services?: ItopsServicesTable | null;
}) {
  const [month, setMonth] = useState(ALL);
  const [team, setTeam] = useState(ALL);

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
      <div className="space-y-6">
        <ServicesIntro services={services} />
        <div className="panel p-10 text-center text-sm text-muted-foreground">
        This report has no ITOPS data. Upload a workbook that contains an “ITOPS” sheet with
        Team Name, Baseline, Month, Tickets Assigned, Tickets Closed, Pending and Current
          closure rate columns.
        </div>
      </div>
    );
  }

  const assigned = filtered.reduce((acc, row) => acc + row.assigned, 0);
  const closed = filtered.reduce((acc, row) => acc + row.closed, 0);
  const pending = filtered.reduce((acc, row) => acc + row.pending, 0);
  const closureRate = assigned > 0 ? (closed / assigned) * 100 : null;

  const kpis = [
    { label: "Tickets assigned", value: assigned.toLocaleString(), icon: Ticket, cls: "text-foreground" },
    { label: "Tickets closed", value: closed.toLocaleString(), icon: CheckCircle2, cls: "text-foreground" },
    { label: "Pending / open", value: pending.toLocaleString(), icon: Clock, cls: "text-foreground" },
    { label: "Closure rate", value: formatPct(closureRate), icon: Gauge, cls: tone(closureRate) },
  ];

  return (
    <div className="space-y-6">
      <ServicesIntro services={services} />
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

      <section className="panel flex flex-col p-5">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground">
          Rethink SLAs
        </h3>
        <div className="sla-dependency rounded-lg border p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Can not be tracked - Rethink Dependencies
          </h4>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            DevOps
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {devopsMetrics.map((metric) => (
              <SlaMetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Security
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {securityMetrics.map((metric) => (
              <SlaMetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            HelpDesk
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {helpdeskMetrics.map((metric) => (
              <SlaMetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        </div>

      </section>



      <ChartFrame
        title="ITOPS ticket volume by team"
        description="Assigned, closed and pending tickets per team for the current selection."
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={teamRows} margin={{ top: 8, right: 24, left: 42, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="team" {...axisProps} interval={0} angle={-15} height={50} dy={10} />
            <YAxis
              {...axisProps}
              label={{
                value: "no of tickets",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "var(--muted-foreground)", fontSize: 12 },
              }}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="assigned" name="Assigned" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="closed" name="Closed" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="pending" name="Pending" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Team-wise ITOPS summary</h3>
          <p className="text-xs text-muted-foreground">
            Aggregated across the selected months, with baseline SLA for reference.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Team</th>
                <th className="px-5 py-3 text-left font-semibold">Baseline</th>
                <th className="px-5 py-3 text-right font-semibold">Tickets assigned</th>
                <th className="px-5 py-3 text-right font-semibold">Tickets closed</th>
                <th className="px-5 py-3 text-right font-semibold">Pending / open</th>
                <th className="px-5 py-3 text-right font-semibold">Closure rate</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map((row) => (
                <tr key={row.team} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{row.team}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.baseline || "—"}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.assigned}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.closed}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.pending}</td>
                  <td className={cn("metric-figure px-5 py-3 text-right font-semibold", tone(row.closureRate))}>
                    {formatPct(row.closureRate)}
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
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Team</th>
                <th className="px-5 py-3 text-left font-semibold">Baseline</th>
                <th className="px-5 py-3 text-left font-semibold">Month</th>
                <th className="px-5 py-3 text-right font-semibold">Assigned</th>
                <th className="px-5 py-3 text-right font-semibold">Closed</th>
                <th className="px-5 py-3 text-right font-semibold">Pending</th>
                <th className="px-5 py-3 text-right font-semibold">Closure rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={`${row.team}-${row.month}-${index}`} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{row.team}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.baseline || "—"}</td>
                  <td className="px-5 py-3">{row.month}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.assigned}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.closed}</td>
                  <td className="metric-figure px-5 py-3 text-right">{row.pending}</td>
                  <td className={cn("metric-figure px-5 py-3 text-right", tone(row.closureRate))}>
                    {formatPct(row.closureRate)}
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
