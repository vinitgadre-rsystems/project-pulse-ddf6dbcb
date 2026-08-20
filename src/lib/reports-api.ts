import { supabase } from "@/integrations/supabase/client";
import type {
  AiRow,
  AiResourceRow,
  AiAgentRow,
  ProdSupportWeekRow,
  ProdSupportPersonRow,
  ItopsRow,
  ItopsServicesTable,
  QualitySummary,
  ReportRow,
  MilestoneRow,
  RiskRow,
  StoredReport,
  TeamDetail,
} from "@/lib/report";

const COLUMNS =
  "id, name, file_name, uploaded_at, row_count, rows, itops, itops_services, ai, ai_resources, ai_agents, team_details, risks, milestones, quality";

// Production Support data is stored inside the `quality` JSON payload so that
// no additional database columns are required.
type QualityPayload = QualitySummary & {
  prodSupportWeeks?: ProdSupportWeekRow[];
  prodSupportPeople?: ProdSupportPersonRow[];
};

function normalize(row: Record<string, unknown>): StoredReport {
  const quality = (row.quality ?? null) as QualityPayload | null;
  return {
    ...(row as unknown as StoredReport),
    prod_support_weeks: quality?.prodSupportWeeks ?? [],
    prod_support_people: quality?.prodSupportPeople ?? [],
  };
}

export async function fetchReports(): Promise<StoredReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(COLUMNS)
    .order("uploaded_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(normalize);
}

export async function saveReport(input: {
  name: string;
  fileName: string;
  rows: ReportRow[];
  itops: ItopsRow[];
  itopsServices: ItopsServicesTable | null;
  ai: AiRow[];
  aiResources: AiResourceRow[];
  aiAgents: AiAgentRow[];
  prodSupportWeeks: ProdSupportWeekRow[];
  prodSupportPeople: ProdSupportPersonRow[];
  teamDetails: TeamDetail[];
  risks: RiskRow[];
  milestones: MilestoneRow[];
  quality: QualitySummary;
}): Promise<StoredReport> {
  const { data: auth } = await supabase.auth.getUser();

  const qualityPayload: QualityPayload = {
    ...input.quality,
    prodSupportWeeks: input.prodSupportWeeks,
    prodSupportPeople: input.prodSupportPeople,
  };

  const { data, error } = await supabase
    .from("reports")
    .insert({
      uploaded_by: auth.user?.id ?? null,
      name: input.name,
      file_name: input.fileName,
      row_count: input.rows.length,
      rows: input.rows as unknown as never,
      itops: input.itops as unknown as never,
      itops_services: input.itopsServices as unknown as never,
      ai: input.ai as unknown as never,
      ai_resources: input.aiResources as unknown as never,
      ai_agents: input.aiAgents as unknown as never,
      team_details: input.teamDetails as unknown as never,
      risks: input.risks as unknown as never,
      milestones: input.milestones as unknown as never,
      quality: qualityPayload as unknown as never,
    })

    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return normalize(data as unknown as Record<string, unknown>);
}
