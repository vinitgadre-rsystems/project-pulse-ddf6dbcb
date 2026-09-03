import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { ReportRow } from "@/lib/report";
import { computeMetrics, formatPct } from "@/lib/report";
import { Input } from "@/components/ui/input";

type Column = {
  key: string;
  label: string;
  numeric?: boolean;
  value: (row: ReportRow) => string | number | null;
};

const columns: Column[] = [
  { key: "team", label: "Team", value: (r) => r.team },
  { key: "sprint", label: "Sprint", value: (r) => r.sprint },
  { key: "month", label: "Month", value: (r) => r.month },
  { key: "totalTickets", label: "Tickets", numeric: true, value: (r) => r.totalTickets },
  {
    key: "readinessPct",
    label: "Readiness %",
    numeric: true,
    value: (r) => computeMetrics([r]).readinessPct,
  },
  {
    key: "completionPct",
    label: "Completed / committed %",
    numeric: true,
    value: (r) => computeMetrics([r]).completionPct,
  },
  {
    key: "hygienePct",
    label: "Hygiene (QA) %",
    numeric: true,
    value: (r) => computeMetrics([r]).hygienePct,
  },
  { key: "totalCommits", label: "Total commits", numeric: true, value: (r) => r.totalCommits ?? null },
  {
    key: "daysWithCommits",
    label: "Days with commits",
    numeric: true,
    value: (r) => r.daysWithCommits ?? null,
  },
  { key: "prsCreated", label: "PRs Created", numeric: true, value: (r) => r.prsCreated ?? null },
  {
    key: "deviationReason",
    label: "Deviation Reasons Completion Ratio",
    value: (r) => (r.deviationReason ?? "").trim() || "—",
  },
];

export function DataTable({ rows }: { rows: ReportRow[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("team");
  const [asc, setAsc] = useState(true);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const base = needle
      ? rows.filter((row) =>
          [row.team, row.sprint, row.month]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : rows;
    const column = columns.find((c) => c.key === sortKey) ?? columns[0]!;
    return [...base].sort((a, b) => {
      const va = column.value(a);
      const vb = column.value(b);
      if (typeof va === "number" || typeof vb === "number") {
        const na = typeof va === "number" ? va : -1;
        const nb = typeof vb === "number" ? vb : -1;
        return asc ? na - nb : nb - na;
      }
      return asc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [rows, query, sortKey, asc]);

  return (
    <section className="panel p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Detailed data</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {filtered.length} of {rows.length} rows in the current filter set.
          </p>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search team, sprint or month"
          className="h-9 w-full max-w-xs"
        />
      </header>

      <div className="mt-4 max-h-[460px] overflow-auto rounded-lg border border-border">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
                    column.numeric ? "text-right" : "text-left"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (sortKey === column.key) setAsc((prev) => !prev);
                      else {
                        setSortKey(column.key);
                        setAsc(true);
                      }
                    }}
                    className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                      sortKey === column.key ? "text-foreground" : ""
                    }`}
                  >
                    {column.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, index) => (
              <tr
                key={`${row.team}-${row.sprint}-${row.month}-${index}`}
                className="border-t border-border/70 even:bg-surface/40"
              >
                {columns.map((column) => {
                  const value = column.value(row);
                  return (
                    <td
                      key={column.key}
                      className={`px-3 py-2.5 ${
                        column.numeric ? "text-right tabular-nums" : "font-medium"
                      }`}
                    >
                      {column.key.endsWith("Pct")
                        ? formatPct(value as number | null)
                        : value === null
                          ? "n/a"
                          : String(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  No rows match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
