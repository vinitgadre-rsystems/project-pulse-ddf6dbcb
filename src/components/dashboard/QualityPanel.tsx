import { AlertTriangle, CircleAlert, Info, ShieldCheck } from "lucide-react";
import type { QualitySummary } from "@/lib/report";

export function QualityPanel({ quality }: { quality: QualitySummary }) {
  const stats = [
    { label: "Rows in file", value: quality.totalRows, icon: Info, tone: "text-primary" },
    { label: "Valid rows", value: quality.validRows, icon: ShieldCheck, tone: "text-success" },
    { label: "Invalid rows", value: quality.invalidRows, icon: CircleAlert, tone: "text-destructive" },
    { label: "Blank values", value: quality.missingValues, icon: AlertTriangle, tone: "text-warning" },
    { label: "Zero denominators", value: quality.zeroDenominators, icon: AlertTriangle, tone: "text-warning" },
  ];

  return (
    <section className="panel p-5">
      <h3 className="text-base font-semibold">Data quality summary</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Validation results from the imported workbook.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-surface/50 p-3">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.tone}`} />
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>
            <p className="metric-figure mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {quality.unmappedColumns.length > 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-surface/50 p-3 text-xs text-muted-foreground">
          Unused columns from the file: {quality.unmappedColumns.join(", ")}
        </p>
      ) : null}

      {quality.issues.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Validation messages
          </p>
          <ul className="mt-2 max-h-56 space-y-1.5 overflow-auto pr-1 text-xs">
            {quality.issues.map((issue, index) => (
              <li
                key={`${issue.rowNumber}-${index}`}
                className={`rounded-md border px-3 py-2 ${
                  issue.severity === "error"
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-warning/40 bg-warning/10 text-warning-foreground"
                }`}
              >
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-xs text-success">
          No validation problems were found in this report.
        </p>
      )}
    </section>
  );
}
