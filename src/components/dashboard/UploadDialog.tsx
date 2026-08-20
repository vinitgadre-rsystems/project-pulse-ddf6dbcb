import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseWorkbook, type ParsedReport } from "@/lib/report";
import { saveReport } from "@/lib/reports-api";

export function UploadDialog({ onSaved }: { onSaved: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [parsed, setParsed] = useState<ParsedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setParsed(null);
    setError(null);
    setName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (selected: File | null) => {
    setParsed(null);
    setError(null);
    setFile(selected);
    if (!selected) return;

    if (!/\.(xlsx|xls|csv)$/i.test(selected.name)) {
      setError("Please choose an .xlsx, .xls or .csv file.");
      return;
    }

    try {
      const buffer = await selected.arrayBuffer();
      const result = parseWorkbook(buffer);
      setParsed(result);
      setName((current) => current || selected.name.replace(/\.[^.]+$/, ""));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read this file.");
    }
  };

  const handleSave = async () => {
    if (!parsed || !file) return;
    setSaving(true);
    try {
      const saved = await saveReport({
        name: name.trim() || file.name,
        fileName: file.name,
        rows: parsed.rows,
        itops: parsed.itops,
        itopsServices: parsed.itopsServices,
        ai: parsed.ai,
        teamDetails: parsed.teamDetails,
        risks: parsed.risks,
        milestones: parsed.milestones,
        aiResources: parsed.aiResources,
        aiAgents: parsed.aiAgents,
        prodSupportWeeks: parsed.prodSupportWeeks,
        prodSupportPeople: parsed.prodSupportPeople,


        quality: parsed.quality,
      });
      toast.success("Report published", {
        description: `${parsed.rows.length} rows are now available to everyone.`,
      });
      onSaved(saved.id);
      setOpen(false);
      reset();
    } catch (cause) {
      toast.error("Could not save the report", {
        description: cause instanceof Error ? cause.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload project health data</DialogTitle>
          <DialogDescription>
            Expected columns: Team, Sprint, Month, Total ticket count, Ticket readiness
            compliance, Self QA compliance, Committed, Completed, Process Hygiene.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-file">Excel file</Label>
            <Input
              id="report-file"
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-name">Report name</Label>
            <Input
              id="report-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Q3 engineering health"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {parsed ? (
            <div className="rounded-lg border border-border bg-surface/50 p-3 text-sm">
              <p className="font-medium">
                {parsed.quality.validRows} valid rows ready to publish
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {parsed.quality.invalidRows} invalid · {parsed.quality.missingValues} blank
                values · {parsed.quality.zeroDenominators} zero denominators
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={!parsed || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publish report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
