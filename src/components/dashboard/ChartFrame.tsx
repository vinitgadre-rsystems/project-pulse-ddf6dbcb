import type { ReactNode } from "react";

export function ChartFrame({
  title,
  description,
  action,
  children,
  height = 320,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  height?: number;
}) {
  return (
    <section className="panel flex flex-col p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div
        className="mt-4 w-full resize-y overflow-auto rounded-lg border border-border/60 bg-surface/40 p-2"
        style={{ height, minHeight: 200 }}
      >
        {children}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Drag the bottom-right corner to resize this chart.
      </p>
    </section>
  );
}
