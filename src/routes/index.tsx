import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Loader2, RefreshCw } from "lucide-react";
import commonLogo from "@/assets/common-logo.png.asset.json";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { VelocityChart } from "@/components/dashboard/Charts";
import { DataTable } from "@/components/dashboard/DataTable";
import { ItopsPanel } from "@/components/dashboard/ItopsPanel";
import { AiSummaryPanel } from "@/components/dashboard/AiSummaryPanel";
import { ProductionSupportPanel } from "@/components/dashboard/ProductionSupportPanel";
import { JellyfishMetrics } from "@/components/dashboard/JellyfishMetrics";



import { UploadDialog } from "@/components/dashboard/UploadDialog";
import { computeMetrics, exportReport, sortLabels, type ReportRow } from "@/lib/report";
import { exportElementToPdf } from "@/lib/pdf-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchReports } from "@/lib/reports-api";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RethinkFirst Pulse – Health & Performance Dashboard | RSI" },
      {
        name: "description",
        content:
          "Executive dashboard comparing team delivery health across sprints and months: ticket readiness, self QA, completion ratio and process hygiene.",
      },
      { property: "og:title", content: "RethinkFirst Pulse – Health & Performance Dashboard" },
      {
        property: "og:description",
        content:
          "Upload your delivery spreadsheet and track team compliance, sprint trends and process hygiene in one leadership view.",
      },
    ],
  }),
  component: Dashboard,
});

const ALL = "__all__";

function Dashboard() {
  const queryClient = useQueryClient();
  const [reportId, setReportId] = useState<string | null>(null);
  const [team, setTeam] = useState<string>("");
  const [sprint, setSprint] = useState(ALL);
  const [month, setMonth] = useState(ALL);
  const [tab, setTab] = useState<"delivery" | "itops">("delivery");



  const { session } = useSession();

  const { data: reports = [], isLoading, isFetching } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  useEffect(() => {
    if (!reportId && reports.length > 0) setReportId(reports[0]!.id);
  }, [reports, reportId]);

  const report = reports.find((item) => item.id === reportId) ?? reports[0] ?? null;
  const allRows: ReportRow[] = useMemo(() => report?.rows ?? [], [report]);

  const teams = useMemo(
    () => sortLabels(Array.from(new Set(allRows.map((r) => r.team))), "sprint"),
    [allRows],
  );
  const months = useMemo(
    () => sortLabels(Array.from(new Set(allRows.map((r) => r.month))), "month"),
    [allRows],
  );

  useEffect(() => {
    setTeam(teams[0] ?? "");
    setSprint(ALL);
    setMonth(ALL);
  }, [reportId, teams]);


  const rows = useMemo(
    () =>
      allRows.filter(
        (row) =>
          row.team === team &&
          (sprint === ALL || row.sprint === sprint) &&
          (month === ALL || row.month === month),
      ),
    [allRows, team, sprint, month],
  );

  const teamDefault = teams[0] ?? "";
  const metrics = useMemo(() => computeMetrics(rows), [rows]);
  const baselineMetrics = useMemo(
    () => computeMetrics(allRows.filter((row) => row.team === team)),
    [allRows, team],
  );

  const teamDetail = useMemo(() => {
    const details = report?.team_details ?? [];
    const key = team.trim().toLowerCase();
    if (!key) return undefined;
    const matchesTeam = (detail: { team: string }) => {
      const other = detail.team.trim().toLowerCase();
      return other === key || other.includes(key) || key.includes(other);
    };
    const teamRows = details.filter(matchesTeam);
    if (teamRows.length === 0) return undefined;

    if (month !== ALL) {
      const monthKey = month.trim().toLowerCase();
      const monthRow = teamRows.find((detail) => {
        const other = (detail.month ?? "").trim().toLowerCase();
        return !!other && (other === monthKey || other.includes(monthKey) || monthKey.includes(other));
      });
      if (monthRow) return monthRow;
    }

    // Fallback: show the team's latest available headcount row
    return teamRows[teamRows.length - 1];
  }, [report?.team_details, team, month]);


  const filtersActive = team !== teamDefault || sprint !== ALL || month !== ALL;



  const captureRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const handleDownload = () => {
    if (rows.length === 0) {
      toast.error("Nothing to export", {
        description: "There are no rows in the current filter selection.",
      });
      return;
    }
    exportReport(rows, `${report?.name ?? "project-health"}-report.xlsx`);
    toast.success("Report downloaded");
  };

  const handleDownloadPdf = async () => {
    const node = captureRef.current;
    if (!node) return;
    setPdfBusy(true);
    const loading = toast.loading("Generating PDF…");
    try {
      // let charts settle at their current size before capturing
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 250)));
      await exportElementToPdf(
        node,
        `${report?.name ?? "rethinkfirst-pulse"}-${tab}-dashboard.pdf`,
      );
      toast.success("PDF downloaded", { id: loading });
    } catch (error) {
      toast.error("Could not generate PDF", {
        id: loading,
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" ref={captureRef}>

      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <img src={commonLogo.url} alt="RSI and RethinkFirst" className="h-14 w-56 object-contain" />
            <div className="pl-1">
              <h1 className="text-lg font-semibold leading-tight">
                RethinkFirst Pulse – Health & Performance Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Delivery compliance and process hygiene across engineering teams
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["reports"] })}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={pdfBusy}>
                    {pdfBusy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => void handleDownloadPdf()}>
                    <FileText className="mr-2 h-4 w-4" />
                    PDF (dashboard view)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleDownload}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel (data)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-col items-end gap-1">
              <UploadDialog
                onSaved={(id) => {
                  void queryClient.invalidateQueries({ queryKey: ["reports"] });
                  setReportId(id);
                }}
              />
              {report?.uploaded_at ? (
                <span className="text-[11px] text-muted-foreground">
                  Last updated:{" "}
                  {new Date(report.uploaded_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              ) : null}
            </div>

            {session ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  queryClient.clear();
                }}
              >
                Sign out
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
        {isLoading ? (
          <div className="panel flex items-center justify-center gap-3 p-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading saved reports…
          </div>
        ) : !report ? (
          <div className="panel flex flex-col items-center gap-4 p-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">No reports published yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Upload an Excel workbook with team, sprint and ticket compliance columns.
                It is validated, saved to the backend and instantly visible to your team.
              </p>
            </div>
            <UploadDialog
              onSaved={(id) => {
                void queryClient.invalidateQueries({ queryKey: ["reports"] });
                setReportId(id);
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as "delivery" | "itops")}
              >
                <TabsList>
                  <TabsTrigger value="delivery">Delivery health</TabsTrigger>
                  <TabsTrigger value="itops">ITOPS</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {tab === "itops" ? (
              <ItopsPanel rows={report.itops ?? []} services={report.itops_services ?? null} />
            ) : (
              <>
                <section className="panel flex flex-wrap items-end gap-4 p-5">
                  <Filter label="Team" value={team} onChange={setTeam}>
                    {teams.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </Filter>
                  <Filter label="Month" value={month} onChange={setMonth}>
                    <SelectItem value={ALL}>All months</SelectItem>
                    {months.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </Filter>

                  {teamDetail ? (
                    <div className="team-summary flex items-center gap-6 rounded-lg border px-6 py-3.5 shadow-sm">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Team
                        </p>
                        <p className="text-lg font-semibold">
                          {teamDetail.team}
                          {teamDetail.month ? ` · ${teamDetail.month}` : ""}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Developers
                        </p>
                        <p className="text-lg font-semibold">{teamDetail.devs}</p>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          QAs
                        </p>
                        <p className="text-lg font-semibold">{teamDetail.qas}</p>
                      </div>
                    </div>
                  ) : null}


                  <div className="ml-auto flex items-center gap-3">

                    {filtersActive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTeam(teams[0] ?? "");
                          setSprint(ALL);
                          setMonth(ALL);
                        }}

                      >
                        Clear filters
                      </Button>
                    ) : null}
                    {/* Row count hidden per request */}
                  </div>
                </section>

                <KpiCards
                  metrics={metrics}
                  milestones={report.milestones ?? []}
                  month={month === ALL ? undefined : month}
                  team={team}
                />

                <VelocityChart rows={rows} dimension="sprint" />

                {team.trim().toLowerCase() === "bh" ? (
                  <ProductionSupportPanel
                    weeks={report.prod_support_weeks ?? []}
                    people={report.prod_support_people ?? []}
                    month={month === ALL ? undefined : month}
                  />
                ) : null}

                <AiSummaryPanel
                  rows={report.ai_resources ?? []}
                  agents={report.ai_agents ?? []}
                  month={month === ALL ? undefined : month}
                />

                {rows.length === 0 ? (
                  <div className="panel p-10 text-center text-sm text-muted-foreground">
                    No data matches the selected filters.
                  </div>
                ) : (
                  <>
                    <DataTable rows={rows} />
                    <JellyfishMetrics metrics={metrics} baseline={baselineMetrics} />
                  </>
                )}

              </>
            )}

            <p className="pb-6 text-center text-xs text-muted-foreground">
              {report.file_name} · uploaded {new Date(report.uploaded_at).toLocaleString()} ·{" "}
              {report.row_count} stored rows
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  children,
  width = "w-48",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={width}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
