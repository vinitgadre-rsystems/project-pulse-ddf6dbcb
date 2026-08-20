import * as XLSX from "xlsx";

export type ReportRow = {
  team: string;
  sprint: string;
  month: string;
  totalTickets: number;
  readiness: number;
  selfQa: number;
  committed: number;
  completed: number;
  hygiene: number;
  totalCommits?: number;
  daysWithCommits?: number;
  prsCreated?: number;
  issuesResolved?: number;
  avgLeadTimeAll?: number;
  avgLeadTimeStories?: number;
  avgLeadTimeBugs?: number;
  avgLeadTimeSubTasks?: number;
};

export type RowIssue = {
  rowNumber: number;
  severity: "error" | "warning";
  message: string;
};

export type QualitySummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingValues: number;
  zeroDenominators: number;
  unmappedColumns: string[];
  issues: RowIssue[];
};

export type ItopsRow = {
  team: string;
  baseline: string;
  month: string;
  assigned: number;
  closed: number;
  pending: number;
  closureRate: number | null;
};

export type ItopsServicesTable = {
  headers: string[];
  rows: string[][];
};

export type AiRow = {
  team: string;
  month: string;
  totalWorkItems: number;
  aiDelivered: number;
  aiDeliveredPct: number | null;
  fullyCompleted: number;
  partial: number;
  humanOnly: number;
  aiFailed: number;
  missingOutcomes: number;
  qaAcceptanceRate: number | null;
};

export type AiResourceRow = {
  team: string;
  resource: string;
  month: string;
  ticketsWithAi: number;
  totalTickets: number;
  aiUsagePct: number | null;
  shared?: string | null;
};


export type AiAgentRow = {
  team: string;
  agent: string;
  month: string;
};

export type ProdSupportWeekRow = {
  week: string;
  dateRange: string;
  issueCount: number;
  month: string;
};

export type ProdSupportPersonRow = {
  name: string;
  issueCount: number;
  month?: string;
};

export type TeamDetail = {
  team: string;
  month?: string;
  devs: number;
  qas: number;
};

export type RiskRow = {
  team: string;
  risk: string;
  owner: string;
  mitigation: string;
};

export type MilestoneRow = {
  feature: string;
  businessValue: string;
  month: string;
  userStories?: number | null;
  storyPoints?: number | null;
};

export type ParsedReport = {
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
};

export type StoredReport = {
  id: string;
  name: string;
  file_name: string;
  uploaded_at: string;
  row_count: number;
  rows: ReportRow[];
  itops?: ItopsRow[] | null;
  itops_services?: ItopsServicesTable | null;
  ai?: AiRow[] | null;
  ai_resources?: AiResourceRow[] | null;
  ai_agents?: AiAgentRow[] | null;
  prod_support_weeks?: ProdSupportWeekRow[] | null;
  prod_support_people?: ProdSupportPersonRow[] | null;
  team_details?: TeamDetail[] | null;
  risks?: RiskRow[] | null;
  milestones?: MilestoneRow[] | null;
  quality: QualitySummary;
};



const FIELD_ALIASES: Record<keyof ReportRow, string[]> = {
  team: ["team", "teamname", "squad", "pod"],
  sprint: ["sprint", "sprintname", "sprintno", "sprintnumber", "iteration"],
  month: ["month", "monthname", "period", "reportingmonth"],
  totalTickets: [
    "totalticketcount",
    "totaltickets",
    "totalticket",
    "totalcount",
    "tickets",
  ],
  readiness: [
    "ticketreadinesscompliance",
    "ticketreadiness",
    "readinesscompliance",
    "readiness",
  ],
  selfQa: ["selfqacompliance", "selfqa", "selfqacount", "selfqadone"],
  committed: ["committed", "committedtickets", "commitment", "commited"],
  completed: ["completed", "completedtickets", "done"],
  hygiene: ["processhygiene", "processhygienecount", "hygiene"],
  totalCommits: ["totalcommits", "totalcommit", "commits"],
  daysWithCommits: ["dayswithcommits", "dayswithcommit", "activedays", "commitdays"],
  prsCreated: ["prscreated", "prcreated", "prs", "pullrequests", "pullrequestscreated"],
  issuesResolved: ["issuesresolved", "issueresolved", "resolvedissues"],
  avgLeadTimeStories: [
    "avgleadtimestories",
    "averageleadtimestories",
    "leadtimestories",
    "avgleadtimestory",
  ],
  avgLeadTimeBugs: ["avgleadtimebugs", "averageleadtimebugs", "leadtimebugs", "avgleadtimebug"],
  avgLeadTimeSubTasks: [
    "avgleadtimesubtasks",
    "averageleadtimesubtasks",
    "leadtimesubtasks",
    "avgleadtimesubtask",
  ],
  avgLeadTimeAll: ["avgleadtimeall", "averageleadtimeall", "leadtimeall", "avgleadtime"],
};

const METRIC_ALIASES = {
  team: FIELD_ALIASES.team,
  month: FIELD_ALIASES.month,
  totalCommits: FIELD_ALIASES.totalCommits,
  daysWithCommits: FIELD_ALIASES.daysWithCommits,
  prsCreated: FIELD_ALIASES.prsCreated,
  issuesResolved: FIELD_ALIASES.issuesResolved,
  avgLeadTimeStories: FIELD_ALIASES.avgLeadTimeStories,
  avgLeadTimeBugs: FIELD_ALIASES.avgLeadTimeBugs,
  avgLeadTimeSubTasks: FIELD_ALIASES.avgLeadTimeSubTasks,
  avgLeadTimeAll: FIELD_ALIASES.avgLeadTimeAll,
} as const;

type MetricKey = keyof typeof METRIC_ALIASES;

type DevMetrics = {
  totalCommits: number;
  daysWithCommits: number;
  prsCreated: number;
  issuesResolved: number;
  avgLeadTimeAll: number;
  avgLeadTimeStories: number;
  avgLeadTimeBugs: number;
  avgLeadTimeSubTasks: number;
};


const monthKey = (value: string) => normalize(value).slice(0, 24);

function parseMetricSheet(workbook: XLSX.WorkBook) {
  const map = new Map<string, DevMetrics>();
  const name = workbook.SheetNames.find((n) => normalize(n).includes("metric"));
  if (!name) return map;
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  // Find the header row (the metric tab may have title rows above the table).
  const headerIndex = grid.findIndex((row) =>
    row.some((cell) => (FIELD_ALIASES.team as string[]).includes(normalize(String(cell)))),
  );
  if (headerIndex === -1) return map;

  const headers = grid[headerIndex]!.map((cell) => String(cell ?? ""));
  const used = new Set<number>();
  const pick = (key: MetricKey) => {
    const aliases = METRIC_ALIASES[key] as readonly string[];
    let index = headers.findIndex((h, i) => !used.has(i) && aliases.includes(normalize(h)));
    if (index === -1) {
      index = headers.findIndex(
        (h, i) =>
          !used.has(i) &&
          normalize(h) !== "" &&
          aliases.some((alias) => normalize(h).includes(alias)),
      );
    }
    if (index !== -1) used.add(index);
    return index === -1 ? null : index;
  };

  const teamIndex = pick("team");
  if (teamIndex === null) return map;
  const monthIndex = pick("month");
  const commitsIndex = pick("totalCommits");
  const daysIndex = pick("daysWithCommits");
  const prsIndex = pick("prsCreated");
  const issuesIndex = pick("issuesResolved");
  // Lead-time headers vary a lot ("Avg Lead Time (All)", "Average lead time - bugs (days)").
  // Match any header that mentions lead time plus the issue-type keyword.
  const pickLead = (keywords: string[], exclude: string[] = []) => {
    const index = headers.findIndex((h, i) => {
      const n = normalize(h);
      if (used.has(i) || !n.includes("leadtime")) return false;
      if (exclude.some((word) => n.includes(word))) return false;
      return keywords.some((word) => n.includes(word));
    });
    if (index !== -1) used.add(index);
    return index === -1 ? null : index;
  };
  const leadStoriesIndex = pickLead(["story", "stories"]);
  const leadBugsIndex = pickLead(["bug"]);
  const leadSubTasksIndex = pickLead(["subtask", "subtasks", "sub"]);
  const leadAllIndex =
    pickLead(["all", "overall", "total"], ["story", "stories", "bug", "sub"]) ??
    pickLead([""]);

  const indices = [
    commitsIndex,
    daysIndex,
    prsIndex,
    issuesIndex,
    leadStoriesIndex,
    leadBugsIndex,
    leadSubTasksIndex,
    leadAllIndex,
  ];
  if (indices.every((index) => index === null)) return map;

  const read = (row: unknown[], index: number | null) =>
    index === null ? 0 : (toNumber(row[index]) ?? 0);

  grid.slice(headerIndex + 1).forEach((row) => {
    const team = String(row[teamIndex] ?? "").trim();
    if (!team || normalize(team) === "total") return;
    const month = monthIndex === null ? "" : String(row[monthIndex] ?? "").trim();
    const entry: DevMetrics = {
      totalCommits: read(row, commitsIndex),
      daysWithCommits: read(row, daysIndex),
      prsCreated: read(row, prsIndex),
      issuesResolved: read(row, issuesIndex),
      avgLeadTimeAll: read(row, leadAllIndex),
      avgLeadTimeStories: read(row, leadStoriesIndex),
      avgLeadTimeBugs: read(row, leadBugsIndex),
      avgLeadTimeSubTasks: read(row, leadSubTasksIndex),
    };
    map.set(`${normalize(team)}|${month ? monthKey(month) : "unspecified"}`, entry);
    if (!map.has(normalize(team))) map.set(normalize(team), entry);
  });

  return map;
}


const NUMERIC_FIELDS: (keyof ReportRow)[] = [
  "totalTickets",
  "readiness",
  "selfQa",
  "committed",
  "completed",
  "hygiene",
];

const ITOPS_ALIASES = {
  team: ["team", "teamname", "tower", "function"],
  baseline: ["baseline", "baselinesla", "sla"],
  month: ["month", "period"],
  assigned: ["ticketsassigned", "assigned", "ticketassigned"],
  closed: ["ticketsclosed", "closed", "ticketclosed", "resolved"],
  pending: ["pendingopen", "pending", "open", "pendingtickets"],
  closureRate: ["currentclosurerate", "closurerate", "closure"],
} as const;

type ItopsKey = keyof typeof ITOPS_ALIASES;

export function parseItopsSheet(workbook: XLSX.WorkBook): ItopsRow[] {
  const name = workbook.SheetNames.find(
    (n) => normalize(n).includes("itops") && !normalize(n).includes("service"),
  );
  if (!name) return [];
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const headerIndex = grid.findIndex((row) =>
    row.some((cell) =>
      (ITOPS_ALIASES.team as readonly string[]).includes(normalize(String(cell))),
    ),
  );
  if (headerIndex === -1) return [];

  const headers = grid[headerIndex]!.map((cell) => String(cell ?? ""));
  const used = new Set<number>();
  const pick = (key: ItopsKey) => {
    const aliases = ITOPS_ALIASES[key] as readonly string[];
    let index = headers.findIndex((h, i) => !used.has(i) && aliases.includes(normalize(h)));
    if (index === -1) {
      index = headers.findIndex(
        (h, i) =>
          !used.has(i) &&
          normalize(h) !== "" &&
          aliases.some((alias) => alias.length > 3 && normalize(h).includes(alias)),
      );
    }
    if (index !== -1) used.add(index);
    return index === -1 ? null : index;
  };

  const teamIndex = pick("team");
  if (teamIndex === null) return [];
  const baselineIndex = pick("baseline");
  const monthIndex = pick("month");
  const assignedIndex = pick("assigned");
  const closedIndex = pick("closed");
  const pendingIndex = pick("pending");
  const rateIndex = pick("closureRate");

  const num = (row: unknown[], index: number | null) => {
    if (index === null) return 0;
    const value = toNumber(row[index]);
    return value === null ? 0 : value;
  };

  const out: ItopsRow[] = [];
  grid.slice(headerIndex + 1).forEach((row) => {
    const team = String(row[teamIndex] ?? "").replace(/\u00a0/g, " ").trim();
    if (!team || normalize(team) === "total") return;
    const assigned = num(row, assignedIndex);
    const closed = num(row, closedIndex);
    const pending = pendingIndex === null ? Math.max(assigned - closed, 0) : num(row, pendingIndex);
    let closureRate = rateIndex === null ? null : toNumber(row[rateIndex]);
    if (closureRate !== null && closureRate > 0 && closureRate <= 1 && String(row[rateIndex!]).includes("%") === false) {
      closureRate = closureRate * 100;
    }
    if (closureRate === null) closureRate = assigned > 0 ? (closed / assigned) * 100 : null;
    out.push({
      team,
      baseline:
        baselineIndex === null
          ? ""
          : String(row[baselineIndex] ?? "").replace(/\u00a0/g, " ").trim(),
      month:
        monthIndex === null
          ? "Unspecified"
          : String(row[monthIndex] ?? "").replace(/\u00a0/g, " ").trim() || "Unspecified",
      assigned,
      closed,
      pending,
      closureRate,
    });
  });

  return out;
}

const AI_ALIASES = {
  team: ["team", "teamname", "product", "squad", "pod"],
  month: ["month", "period"],
  totalWorkItems: ["totalworkitems", "totalworkitem", "workitems", "totalitems"],
  aiDelivered: ["aideliveredworkitems", "aidelivereditems", "aidelivered"],
  aiDeliveredPct: ["aidelivered", "aideliveredpercent", "aideliverypercent"],
  fullyCompleted: ["fullycompleted", "fullcompleted", "complete"],
  partial: ["partial", "partiallycompleted"],
  humanOnly: ["humanonly", "human"],
  aiFailed: ["aifailed", "aifail"],
  missingOutcomes: ["missingoutcomes", "missingoutcome", "missing"],
  qaAcceptanceRate: ["qaacceptancerate", "qaacceptance", "acceptancerate"],
} as const;

type AiKey = keyof typeof AI_ALIASES;

export function parseAiSheet(workbook: XLSX.WorkBook): AiRow[] {
  const name = workbook.SheetNames.find((n) => {
    const key = normalize(n);
    return key.includes("aiteamsummary") || (key.startsWith("ai") && key.includes("summary"));
  });
  if (!name) return [];
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const headerIndex = grid.findIndex((row) =>
    row.some((cell) =>
      (AI_ALIASES.team as readonly string[]).includes(normalize(String(cell))),
    ),
  );
  if (headerIndex === -1) return [];

  const headers = grid[headerIndex]!.map((cell) => String(cell ?? ""));
  const rawPct = headers.map((h) => h.includes("%"));
  const used = new Set<number>();
  const pick = (key: AiKey, wantPct?: boolean) => {
    const aliases = AI_ALIASES[key] as readonly string[];
    const ok = (h: string, i: number) =>
      !used.has(i) && (wantPct === undefined || rawPct[i] === wantPct);
    let index = headers.findIndex((h, i) => ok(h, i) && aliases.includes(normalize(h)));
    if (index === -1) {
      index = headers.findIndex(
        (h, i) =>
          ok(h, i) &&
          normalize(h) !== "" &&
          aliases.some((alias) => alias.length > 3 && normalize(h).includes(alias)),
      );
    }
    if (index !== -1) used.add(index);
    return index === -1 ? null : index;
  };

  const teamIndex = pick("team");
  if (teamIndex === null) return [];
  const monthIndex = pick("month");
  const totalIndex = pick("totalWorkItems");
  const deliveredIndex = pick("aiDelivered", false);
  const deliveredPctIndex = pick("aiDeliveredPct");
  const fullyIndex = pick("fullyCompleted");
  const partialIndex = pick("partial");
  const humanIndex = pick("humanOnly");
  const failedIndex = pick("aiFailed");
  const missingIndex = pick("missingOutcomes");
  const qaIndex = pick("qaAcceptanceRate");

  const num = (row: unknown[], index: number | null) => {
    if (index === null) return 0;
    const value = toNumber(row[index]);
    return value === null ? 0 : value;
  };
  const pct = (row: unknown[], index: number | null) => {
    if (index === null) return null;
    let value = toNumber(row[index]);
    if (value === null) return null;
    if (value > 0 && value <= 1 && !String(row[index]).includes("%")) value *= 100;
    return value;
  };
  const text = (value: unknown) => String(value ?? "").replace(/\u00a0/g, " ").trim();

  const out: AiRow[] = [];
  grid.slice(headerIndex + 1).forEach((row) => {
    const team = text(row[teamIndex]);
    if (!team || normalize(team) === "total") return;
    const totalWorkItems = num(row, totalIndex);
    const aiDelivered = num(row, deliveredIndex);
    const aiDeliveredPct =
      pct(row, deliveredPctIndex) ??
      (totalWorkItems > 0 ? (aiDelivered / totalWorkItems) * 100 : null);
    out.push({
      team,
      month: monthIndex === null ? "Unspecified" : text(row[monthIndex]) || "Unspecified",
      totalWorkItems,
      aiDelivered,
      aiDeliveredPct,
      fullyCompleted: num(row, fullyIndex),
      partial: num(row, partialIndex),
      humanOnly: num(row, humanIndex),
      aiFailed: num(row, failedIndex),
      missingOutcomes: num(row, missingIndex),
      qaAcceptanceRate: pct(row, qaIndex),
    });
  });

  return out;
}


const normalize = (value: string) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

function mapHeaders(headers: string[]) {
  const mapping: Partial<Record<keyof ReportRow, string>> = {};
  const used = new Set<string>();

  (Object.keys(FIELD_ALIASES) as (keyof ReportRow)[]).forEach((field) => {
    const aliases = FIELD_ALIASES[field];
    const exact = headers.find(
      (h) => !used.has(h) && aliases.includes(normalize(h)),
    );
    const fuzzy =
      exact ??
      headers.find(
        (h) =>
          !used.has(h) &&
          aliases.some((alias) => normalize(h).includes(alias) && alias.length > 4),
      );
    if (fuzzy) {
      mapping[field] = fuzzy;
      used.add(fuzzy);
    }
  });

  const unmapped = headers.filter((h) => !used.has(h) && String(h).trim() !== "");
  return { mapping, unmapped };
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[%,\s]/g, "");
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  if (Number.isFinite(parsed)) return parsed;
  // Values like "3.4 days", "12 hrs", "~5d" – take the first number in the text.
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;

}

export function parseWorkbook(data: ArrayBuffer): ParsedReport {
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("The workbook contains no sheets.");
  const sheet = workbook.Sheets[sheetName]!;
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (raw.length === 0) {
    throw new Error("The first sheet has no data rows.");
  }

  const headers = Object.keys(raw[0]!);
  const { mapping, unmapped } = mapHeaders(headers);

  if (!mapping.team) {
    throw new Error(
      `Could not find a "Team" column. Found columns: ${headers.join(", ")}`,
    );
  }

  const rows: ReportRow[] = [];
  const issues: RowIssue[] = [];
  let missingValues = 0;
  let zeroDenominators = 0;
  let invalidRows = 0;

  raw.forEach((record, index) => {
    const rowNumber = index + 2; // account for header row
    const team = String(record[mapping.team!] ?? "").trim();
    const sprint = mapping.sprint
      ? String(record[mapping.sprint] ?? "").trim()
      : "";
    const month = mapping.month ? String(record[mapping.month] ?? "").trim() : "";

    const numbers: Record<string, number> = {};
    let rowMissing = 0;
    let rowInvalid = false;

    NUMERIC_FIELDS.forEach((field) => {
      const header = mapping[field];
      if (!header) {
        numbers[field] = 0;
        return;
      }
      const value = record[header];
      const parsed = toNumber(value);
      if (parsed === null) {
        if (String(value ?? "").trim() !== "") {
          rowInvalid = true;
          issues.push({
            rowNumber,
            severity: "error",
            message: `Row ${rowNumber}: "${header}" has a non-numeric value ("${String(value)}").`,
          });
        } else {
          rowMissing += 1;
        }
        numbers[field] = 0;
      } else if (parsed < 0) {
        rowInvalid = true;
        issues.push({
          rowNumber,
          severity: "error",
          message: `Row ${rowNumber}: "${header}" is negative (${parsed}).`,
        });
        numbers[field] = 0;
      } else {
        numbers[field] = parsed;
      }
    });

    if (!team) {
      invalidRows += 1;
      issues.push({
        rowNumber,
        severity: "error",
        message: `Row ${rowNumber}: missing Team — row skipped.`,
      });
      return;
    }

    if (rowInvalid) {
      invalidRows += 1;
      return;
    }

    if (rowMissing > 0) {
      missingValues += rowMissing;
      issues.push({
        rowNumber,
        severity: "warning",
        message: `Row ${rowNumber}: ${rowMissing} blank metric value(s) treated as 0.`,
      });
    }

    if (numbers['totalTickets'] === 0 || numbers['committed'] === 0) {
      zeroDenominators += 1;
      issues.push({
        rowNumber,
        severity: "warning",
        message: `Row ${rowNumber}: zero denominator (total tickets or committed) — affected ratios shown as n/a.`,
      });
    }

    rows.push({
      team,
      sprint: sprint || "Unspecified",
      month: month || "Unspecified",
      totalTickets: numbers['totalTickets']!,
      readiness: numbers['readiness']!,
      selfQa: numbers['selfQa']!,
      committed: numbers['committed']!,
      completed: numbers['completed']!,
      hygiene: numbers['hygiene']!,
    });
  });

  if (rows.length === 0) {
    throw new Error("No valid rows were found in this file. Check the columns and try again.");
  }

  const devMetrics = parseMetricSheet(workbook);
  if (devMetrics.size > 0) {
    rows.forEach((row) => {
      const match =
        devMetrics.get(`${normalize(row.team)}|${monthKey(row.month)}`) ??
        devMetrics.get(`${normalize(row.team)}|unspecified`) ??
        devMetrics.get(normalize(row.team));

      if (match) Object.assign(row, match);
    });
  }


  return {
    rows,
    itops: parseItopsSheet(workbook),
    itopsServices: parseItopsServicesSheet(workbook),
    ai: parseAiSheet(workbook),
    aiResources: parseAiResourceSheet(workbook),
    aiAgents: parseAiAgentSheet(workbook),
    prodSupportWeeks: parseProductionSupportSheet(workbook).weeks,
    prodSupportPeople: parseProductionSupportSheet(workbook).people,
    teamDetails: parseTeamDetailsSheet(workbook),
    risks: parseRisksSheet(workbook),
    milestones: parseMilestoneSheet(workbook),


    quality: {
      totalRows: raw.length,
      validRows: rows.length,
      invalidRows,
      missingValues,
      zeroDenominators,
      unmappedColumns: unmapped,
      issues: issues.slice(0, 200),
    },
  };
}

export type Metrics = {
  totalTickets: number;
  committed: number;
  completed: number;
  readinessPct: number | null;
  selfQaPct: number | null;
  completionPct: number | null;
  hygienePct: number | null;
  healthScore: number | null;
  avgCommits: number | null;
  avgDaysWithCommits: number | null;
  avgPrsCreated: number | null;
  avgIssuesResolved: number | null;
  avgLeadTimeAll: number | null;
  avgLeadTimeStories: number | null;
  avgLeadTimeBugs: number | null;
  avgLeadTimeSubTasks: number | null;
};

const pct = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? (numerator / denominator) * 100 : null;

function averageDevMetrics(rows: ReportRow[]) {
  const seen = new Map<string, ReportRow>();
  rows.forEach((row) => {
    const key = `${row.team.toLowerCase()}|${row.month.toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, row);
  });
  const unique = Array.from(seen.values());
  const avg = (
    key:
      | "totalCommits"
      | "daysWithCommits"
      | "prsCreated"
      | "issuesResolved"
      | "avgLeadTimeAll"
      | "avgLeadTimeStories"
      | "avgLeadTimeBugs"
      | "avgLeadTimeSubTasks",
  ) => {
    const values = unique
      .map((row) => row[key])
      .filter((value): value is number => typeof value === "number");
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  return {
    avgCommits: avg("totalCommits"),
    avgDaysWithCommits: avg("daysWithCommits"),
    avgPrsCreated: avg("prsCreated"),
    avgIssuesResolved: avg("issuesResolved"),
    avgLeadTimeAll: avg("avgLeadTimeAll"),
    avgLeadTimeStories: avg("avgLeadTimeStories"),
    avgLeadTimeBugs: avg("avgLeadTimeBugs"),
    avgLeadTimeSubTasks: avg("avgLeadTimeSubTasks"),
  };
}

export function computeMetrics(rows: ReportRow[]): Metrics {
  const sum = (key: keyof ReportRow) =>
    rows.reduce((acc, row) => acc + (Number(row[key]) || 0), 0);

  const totalTickets = sum("totalTickets");
  const committed = sum("committed");
  const completed = sum("completed");

  const readinessPct = pct(sum("readiness"), totalTickets);
  const selfQaPct = pct(sum("selfQa"), totalTickets);
  const completionPct = pct(completed, committed);
  const hygienePct = pct(sum("hygiene"), totalTickets);

  const parts = [readinessPct, selfQaPct, completionPct, hygienePct].filter(
    (v): v is number => v !== null,
  );
  const healthScore = parts.length
    ? parts.reduce((a, b) => a + b, 0) / parts.length
    : null;

  return {
    totalTickets,
    committed,
    completed,
    readinessPct,
    selfQaPct,
    completionPct,
    hygienePct,
    healthScore,
    ...averageDevMetrics(rows),
  };
}

export const formatNumber = (value: number | null) =>
  value === null ? "n/a" : value.toFixed(1);


export function groupBy(rows: ReportRow[], key: keyof ReportRow) {
  const groups = new Map<string, ReportRow[]>();
  rows.forEach((row) => {
    const value = String(row[key] ?? "Unspecified");
    const bucket = groups.get(value);
    if (bucket) bucket.push(row);
    else groups.set(value, [row]);
  });
  return Array.from(groups.entries()).map(([label, groupRows]) => ({
    label,
    rows: groupRows,
    metrics: computeMetrics(groupRows),
  }));
}

const MONTH_ORDER = [
  "jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec",
];

export function sortLabels(labels: string[], kind: "sprint" | "month") {
  return [...labels].sort((a, b) => {
    if (kind === "month") {
      const ia = MONTH_ORDER.indexOf(a.slice(0, 3).toLowerCase());
      const ib = MONTH_ORDER.indexOf(b.slice(0, 3).toLowerCase());
      if (ia !== -1 && ib !== -1) return ia - ib;
    }
    const na = Number(a.replace(/[^0-9.]/g, ""));
    const nb = Number(b.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(na) && Number.isFinite(nb) && a !== b && !Number.isNaN(na) && !Number.isNaN(nb)) {
      return na - nb;
    }
    return a.localeCompare(b);
  });
}

export const formatPct = (value: number | null) =>
  value === null ? "n/a" : `${value.toFixed(1)}%`;

export function exportReport(rows: ReportRow[], fileName: string) {
  const detail = rows.map((row) => ({
    Team: row.team,
    Sprint: row.sprint,
    Month: row.month,
    "Total ticket count": row.totalTickets,
    "Ticket readiness compliance": row.readiness,
    "Ticket readiness compliance %": pct(row.readiness, row.totalTickets),
    "Self QA compliance": row.selfQa,
    "Self QA compliance %": pct(row.selfQa, row.totalTickets),
    Committed: row.committed,
    Completed: row.completed,
    "Completed to committed %": pct(row.completed, row.committed),
    "Process hygiene": row.hygiene,
    "Process hygiene %": pct(row.hygiene, row.totalTickets),
  }));

  const summary = groupBy(rows, "team").map(({ label, metrics }) => ({
    Team: label,
    "Total tickets": metrics.totalTickets,
    "Ticket readiness %": metrics.readinessPct,
    "Self QA %": metrics.selfQaPct,
    "Completed to committed %": metrics.completionPct,
    "Process hygiene %": metrics.hygienePct,
    "Health score": metrics.healthScore,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summary),
    "Team summary",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(detail),
    "Detail",
  );
  XLSX.writeFile(workbook, fileName);
}

export function parseTeamDetailsSheet(workbook: XLSX.WorkBook): TeamDetail[] {
  const name = workbook.SheetNames.find((n) => normalize(n).includes("teamdetail"));
  if (!name) return [];
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const isTeam = (cell: unknown) => {
    const key = normalize(String(cell));
    return key === "team" || key === "teamname";
  };
  const headerIndex = grid.findIndex((row) => row.some(isTeam));
  if (headerIndex === -1) return [];

  const headers = grid[headerIndex]!.map((cell) => normalize(String(cell ?? "")));
  const teamIndex = headers.findIndex((h) => h === "team" || h === "teamname");
  const monthIndex = headers.findIndex((h) => h.includes("month"));
  const devIndex = headers.findIndex((h) => h.includes("dev"));
  const qaIndex = headers.findIndex((h) => h.includes("qa"));

  const out: TeamDetail[] = [];
  grid.slice(headerIndex + 1).forEach((row) => {
    const team = String(row[teamIndex] ?? "").replace(/\u00a0/g, " ").trim();
    if (!team || normalize(team) === "total") return;
    const month =
      monthIndex === -1
        ? ""
        : String(row[monthIndex] ?? "").replace(/\u00a0/g, " ").trim();
    out.push({
      team,
      ...(month ? { month } : {}),
      devs: devIndex === -1 ? 0 : toNumber(row[devIndex]) ?? 0,
      qas: qaIndex === -1 ? 0 : toNumber(row[qaIndex]) ?? 0,
    });
  });
  return out;
}

export function parseRisksSheet(workbook: XLSX.WorkBook): RiskRow[] {
  const name = workbook.SheetNames.find((n) => normalize(n).includes("risk"));
  if (!name) return [];
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const headerIndex = grid.findIndex((row) =>
    row.some((cell) => {
      const key = normalize(String(cell));
      return key === "team" || key === "teamname";
    }),
  );
  if (headerIndex === -1) return [];

  const headers = grid[headerIndex]!.map((cell) => normalize(String(cell ?? "")));
  const teamIndex = headers.findIndex((h) => h === "team" || h === "teamname");
  const riskIndex = headers.findIndex((h) => h.includes("risk"));
  const ownerIndex = headers.findIndex((h) => h.includes("owner"));
  const mitigationIndex = headers.findIndex((h) => h.includes("mitigation"));

  const cell = (row: unknown[], index: number) =>
    index === -1 ? "" : String(row[index] ?? "").replace(/\u00a0/g, " ").trim();

  const out: RiskRow[] = [];
  grid.slice(headerIndex + 1).forEach((row) => {
    const team = cell(row, teamIndex);
    const risk = cell(row, riskIndex);
    if (!team && !risk) return;
    out.push({
      team,
      risk,
      owner: cell(row, ownerIndex),
      mitigation: cell(row, mitigationIndex),
    });
  });
  return out;
}

export function parseMilestoneSheet(workbook: XLSX.WorkBook): MilestoneRow[] {
  const name = workbook.SheetNames.find((n) => {
    const key = normalize(n);
    return key.includes("milestone") || key.includes("feature");
  });
  if (!name) return [];
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const headerIndex = grid.findIndex((row) =>
    row.some((cell) => normalize(String(cell)).includes("feature")),
  );
  if (headerIndex === -1) return [];

  const headers = grid[headerIndex]!.map((cell) => normalize(String(cell ?? "")));
  const featureIndex = headers.findIndex((h) => h.includes("feature"));
  const valueIndex = headers.findIndex((h) => h.includes("businessvalue") || h.includes("value"));
  const monthIndex = headers.findIndex((h) => h.includes("month"));
  const storiesIndex = headers.findIndex(
    (h) => h.includes("userstor") || (h.includes("stories") && !h.includes("point")),
  );
  const pointsIndex = headers.findIndex((h) => h.includes("storypoint") || h.includes("points"));

  const cell = (row: unknown[], index: number) =>
    index === -1 ? "" : String(row[index] ?? "").replace(/\u00a0/g, " ").trim();
  const num = (row: unknown[], index: number) => {
    const raw = cell(row, index).replace(/,/g, "");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const out: MilestoneRow[] = [];
  grid.slice(headerIndex + 1).forEach((row) => {
    const feature = cell(row, featureIndex);
    const businessValue = cell(row, valueIndex);
    if (!feature && !businessValue) return;
    out.push({
      feature,
      businessValue,
      month: cell(row, monthIndex),
      userStories: num(row, storiesIndex),
      storyPoints: num(row, pointsIndex),
    });
  });
  return out;
}

export function parseAiResourceSheet(workbook: XLSX.WorkBook): AiResourceRow[] {
  const name = workbook.SheetNames.find((n) => {
    const key = normalize(n);
    return key.includes("airesource") || (key.includes("ai") && key.includes("resource"));
  });
  if (!name) return [];
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const headerIndex = grid.findIndex((row) =>
    row.some((cell) => normalize(String(cell)).includes("resource")),
  );
  if (headerIndex === -1) return [];

  const headers = grid[headerIndex]!.map((cell) => normalize(String(cell ?? "")));
  const teamIndex = headers.findIndex((h) => h === "team" || h === "teamname");
  const resourceIndex = headers.findIndex((h) => h.includes("resource"));
  const monthIndex = headers.findIndex((h) => h.includes("month"));
  const sharedIndex = headers.findIndex((h) => h === "shared");
  const withAiIndex = headers.findIndex(
    (h) => h.includes("withai") || (h.includes("ticket") && h.includes("ai") && !h.includes("total")),
  );
  const totalIndex = headers.findIndex(
    (h) => h.includes("total") && h.includes("ticket"),
  );
  const usageIndex = headers.findIndex((h) => h.includes("aiusage") || h.includes("usage"));

  const cell = (row: unknown[], index: number) =>
    index === -1 ? "" : String(row[index] ?? "").replace(/\u00a0/g, " ").trim();

  const out: AiResourceRow[] = [];
  let lastTeam = "";
  grid.slice(headerIndex + 1).forEach((row) => {
    const resource = cell(row, resourceIndex);
    const team = cell(row, teamIndex) || lastTeam;
    if (team) lastTeam = team;
    if (!resource || normalize(resource) === "total") return;
    const ticketsWithAi = withAiIndex === -1 ? 0 : toNumber(row[withAiIndex]) ?? 0;
    const totalTickets = totalIndex === -1 ? 0 : toNumber(row[totalIndex]) ?? 0;
    let usage = usageIndex === -1 ? null : toNumber(row[usageIndex]);
    if (usage !== null && usage > 0 && usage <= 1 && !String(row[usageIndex]).includes("%")) {
      usage *= 100;
    }
    if (usage === null && totalTickets > 0) usage = (ticketsWithAi / totalTickets) * 100;
    out.push({
      team,
      resource,
      month: cell(row, monthIndex) || "Unspecified",
      ticketsWithAi,
      totalTickets,
      aiUsagePct: usage,
      shared: sharedIndex === -1 ? null : cell(row, sharedIndex) || null,
    });
  });
  return out;
}

export function parseAiAgentSheet(workbook: XLSX.WorkBook): AiAgentRow[] {
  const name = workbook.SheetNames.find((n) => {
    const key = normalize(n);
    return key.includes("aiagent") || (key.includes("ai") && key.includes("agent"));
  });
  if (!name) return [];
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const headerIndex = grid.findIndex((row) =>
    row.some((cell) => {
      const key = normalize(String(cell));
      return key.includes("agent") || key.includes("tool");
    }),
  );
  if (headerIndex === -1) return [];

  const headers = grid[headerIndex]!.map((cell) => normalize(String(cell ?? "")));
  const agentIndex = headers.findIndex((h) => h.includes("agent") || h.includes("tool"));
  const teamIndex = headers.findIndex((h) => h === "team" || h === "teamname");
  const monthIndex = headers.findIndex((h) => h.includes("month"));

  const cell = (row: unknown[], index: number) =>
    index === -1 ? "" : String(row[index] ?? "").replace(/\u00a0/g, " ").trim();

  const out: AiAgentRow[] = [];
  let lastTeam = "";
  grid.slice(headerIndex + 1).forEach((row) => {
    const agent = cell(row, agentIndex);
    const team = cell(row, teamIndex) || lastTeam;
    if (team) lastTeam = team;
    if (!agent || normalize(agent) === "total") return;
    out.push({ team, agent, month: cell(row, monthIndex) || "Unspecified" });
  });
  return out;
}

export function parseItopsServicesSheet(workbook: XLSX.WorkBook): ItopsServicesTable | null {
  const name = workbook.SheetNames.find(
    (n) => normalize(n).includes("itops") && normalize(n).includes("service"),
  );
  if (!name) return null;
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const clean = (cell: unknown) =>
    String(cell ?? "")
      .replace(/\u00a0/g, " ")
      .trim();

  const headerIndex = grid.findIndex(
    (row) => row.filter((cell) => clean(cell) !== "").length >= 2,
  );
  if (headerIndex === -1) return null;

  const headerRow = grid[headerIndex]!.map(clean);
  let lastUsed = -1;
  headerRow.forEach((cell, i) => {
    if (cell !== "") lastUsed = i;
  });
  if (lastUsed === -1) return null;
  const headers = headerRow.slice(0, lastUsed + 1).map((cell, i) => cell || `Column ${i + 1}`);

  const rows: string[][] = [];
  grid.slice(headerIndex + 1).forEach((row) => {
    const values = headers.map((_, i) => {
      const value = row[i];
      if (typeof value === "number") return String(Math.round(value * 100) / 100);
      return clean(value);
    });
    if (values.some((value) => value !== "")) rows.push(values);
  });

  if (rows.length === 0) return null;
  return { headers, rows };
}

export function parseProductionSupportSheet(workbook: XLSX.WorkBook): {
  weeks: ProdSupportWeekRow[];
  people: ProdSupportPersonRow[];
} {
  const empty = { weeks: [] as ProdSupportWeekRow[], people: [] as ProdSupportPersonRow[] };
  const name = workbook.SheetNames.find((n) => {
    const key = normalize(n);
    return key.includes("productionsupport") || (key.includes("production") && key.includes("support")) || key === "prodsupport";
  });
  if (!name) return empty;
  const sheet = workbook.Sheets[name]!;
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const clean = (value: unknown) => String(value ?? "").replace(/\u00a0/g, " ").trim();
  const weeks: ProdSupportWeekRow[] = [];
  const people: ProdSupportPersonRow[] = [];

  let mode: "none" | "weeks" | "people" = "none";
  let idx: Record<string, number> = {};
  let lastMonth = "";

  grid.forEach((row) => {
    const headers = row.map((cell) => normalize(clean(cell)));
    const hasIssueCount = headers.some((h) => h.includes("issuecount") || (h.includes("issue") && h.includes("count")));
    if (hasIssueCount && headers.some((h) => h === "week" || h.startsWith("week"))) {
      mode = "weeks";
      idx = {
        week: headers.findIndex((h) => h.startsWith("week")),
        range: headers.findIndex((h) => h.includes("daterange") || h.includes("range") || h.includes("date")),
        count: headers.findIndex((h) => h.includes("issue")),
        month: headers.findIndex((h) => h.includes("month")),
      };
      return;
    }
    if (hasIssueCount && headers.some((h) => h === "name" || h.includes("resource") || h.includes("engineer"))) {
      mode = "people";
      idx = {
        name: headers.findIndex((h) => h === "name" || h.includes("resource") || h.includes("engineer")),
        count: headers.findIndex((h) => h.includes("issue")),
      };
      return;
    }

    const nonEmpty = row.filter((cell) => clean(cell) !== "").length;
    if (nonEmpty === 0) return;

    if (mode === "weeks") {
      const week = clean(row[idx['week']!]);
      if (!week || normalize(week) === "total") return;
      const rowMonth = idx['month']! === -1 ? "" : clean(row[idx['month']!]);
      if (rowMonth) lastMonth = rowMonth;
      weeks.push({
        week,
        dateRange: idx['range']! === -1 ? "" : clean(row[idx['range']!]),
        issueCount: (idx['count']! === -1 ? null : toNumber(row[idx['count']!])) ?? 0,
        month: rowMonth,
      });
    } else if (mode === "people") {
      const person = clean(row[idx['name']!]);
      if (!person || normalize(person) === "total") return;
      people.push({
        name: person,
        issueCount: (idx['count']! === -1 ? null : toNumber(row[idx['count']!])) ?? 0,
        month: lastMonth,
      });
    }
  });

  return { weeks, people };
}
