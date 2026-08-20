import { Sparkles } from "lucide-react";

import type { MilestoneRow } from "@/lib/report";

export function FeaturesPanel({
  milestones = [],
  month,
}: {
  milestones?: MilestoneRow[] | undefined;
  month?: string | undefined;
}) {
  const key = (value: string) => value.trim().toLowerCase();
  const selected = month && key(month) !== "all" ? key(month) : "";

  const items = selected
    ? milestones.filter((item) => {
        const other = key(item.month ?? "");
        return !other || other === selected || other.includes(selected) || selected.includes(other);
      })
    : milestones;

  return (
    <section className="panel p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Features delivered{selected ? ` · ${month}` : " this month"}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No milestones recorded for this selection.
        </p>
      ) : (
        <ul className="mt-3 grid max-h-64 gap-2 overflow-auto pr-1 sm:grid-cols-2">
          {items.map((item, index) => (
            <li
              key={`${item.feature}-${index}`}
              className="rounded-md border border-border/60 bg-surface/40 p-2 text-xs"
            >
              <div className="flex items-start gap-2">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="font-semibold text-foreground">{item.feature}</p>
                  {item.businessValue ? (
                    <p className="mt-0.5 text-muted-foreground">{item.businessValue}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
