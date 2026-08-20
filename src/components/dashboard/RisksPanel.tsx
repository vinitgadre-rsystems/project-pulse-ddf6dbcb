import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RiskRow } from "@/lib/report";

const ALL = "__all__";

export function RisksPanel({ rows }: { rows: RiskRow[] }) {
  const [team, setTeam] = useState(ALL);

  const teams = useMemo(
    () => Array.from(new Set(rows.map((row) => row.team).filter(Boolean))).sort(),
    [rows],
  );

  const filtered = useMemo(
    () => (team === ALL ? rows : rows.filter((row) => row.team === team)),
    [rows, team],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, RiskRow[]>();
    filtered.forEach((row) => {
      const key = row.team || "Unassigned";
      map.set(key, [...(map.get(key) ?? []), row]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (rows.length === 0) {
    return (
      <div className="panel flex flex-col items-center gap-3 p-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          No risks found. Add a “Risks” sheet with Team Name, Risk Description, Owner and
          Mitigation columns and upload again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="panel flex flex-wrap items-end gap-4 p-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Team
          </p>
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="w-48">
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
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Risks in view</p>
          <p className="metric-figure text-lg font-semibold">
            {filtered.length}
            <span className="text-sm font-normal text-muted-foreground"> / {rows.length}</span>
          </p>
        </div>
      </section>

      {grouped.map(([teamName, teamRisks]) => (
        <section key={teamName} className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold">{teamName}</h3>
            <span className="text-xs text-muted-foreground">
              {teamRisks.length} risk{teamRisks.length === 1 ? "" : "s"}
            </span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Risk</th>
                  <th className="px-5 py-3 text-left font-medium">Owner</th>
                  <th className="px-5 py-3 text-left font-medium">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {teamRisks.map((row, index) => (
                  <tr key={`${teamName}-${index}`} className="border-t border-border/70">
                    <td className="px-5 py-3">{row.risk || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.owner || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.mitigation || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
