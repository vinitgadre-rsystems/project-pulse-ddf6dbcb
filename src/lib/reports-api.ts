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
  "id, name, file_name, uploaded_at, row_count, rows, itops, itops_services, ai, ai_resources, ai_agents, prod_support_weeks, prod_support_people, team_details, risks, milestones, quality";


export async function fetchReports(): Promise<StoredReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(COLUMNS)
    .order("uploaded_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as StoredReport[];
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
      prod_support_weeks: input.prodSupportWeeks as unknown as never,
      prod_support_people: input.prodSupportPeople as unknown as never,
      team_details: input.teamDetails as unknown as never,
      risks: input.risks as unknown as never,
      milestones: input.milestones as unknown as never,
      quality: input.quality as unknown as never,
    })

    .select(COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as StoredReport;
}
