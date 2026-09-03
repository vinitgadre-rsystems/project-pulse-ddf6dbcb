import { Layers, Sparkles, Sigma } from "lucide-react";

import type { MilestoneRow } from "@/lib/report";

export function FeaturesPanel({
  milestones = [],
  month,
  team,
}: {
  milestones?: MilestoneRow[] | undefined;
  month?: string | undefined;
  team?: string | undefined;
}) {
  const key = (value: string) => value.trim().toLowerCase();
  const selected = month && key(month) !== "all" ? key(month) : "";

  const selectedTeam = team && key(team) !== "all" ? key(team) : "";
  const byTeam = selectedTeam
    ? milestones.filter((item) => {
        const other = key(item.team ?? "");
        return !other || other === selectedTeam;
      })
    : milestones;

  const items = selected
    ? byTeam.filter((item) => {
        const other = key(item.month ?? "");
        return !other || other === selected || other.includes(selected) || selected.includes(other);
      })
    : byTeam;

  const totalStories = items.reduce((sum, item) => sum + (item.userStories ?? 0), 0);
  const totalPoints = items.reduce((sum, item) => sum + (item.storyPoints ?? 0), 0);
  const hasTotals = totalStories > 0 || totalPoints > 0;

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Features delivered{selected ? ` · ${month}` : " · All months"}
          </h3>
        </div>
        {hasTotals ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="metric-figure text-sm font-bold text-primary">{totalStories}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                User stories
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2 py-1">
              <Sigma className="h-3.5 w-3.5 text-success" />
              <span className="metric-figure text-sm font-bold text-success">{totalPoints}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Story points
              </span>
            </div>
          </div>
        ) : null}
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
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{item.feature}</p>
                  {item.businessValue ? (
                    <p className="mt-0.5 text-muted-foreground">{item.businessValue}</p>
                  ) : null}
                  {item.userStories || item.storyPoints ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {item.userStories ? (
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {item.userStories} stories
                        </span>
                      ) : null}
                      {item.storyPoints ? (
                        <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                          {item.storyPoints} pts
                        </span>
                      ) : null}
                    </div>
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
