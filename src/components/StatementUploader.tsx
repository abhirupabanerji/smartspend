import { useCallback, useRef, useState } from "react";
import {
  Upload, FileText, Download, FileSpreadsheet,
  AlertTriangle, CheckCircle2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseCSV, addStatement, type StatementUpload } from "@/lib/statement-store";
import { validateCSVStructure, downloadTemplate, type ValidationResult } from "@/lib/csv-template";
import { useAuth } from "@/lib/auth-context";
import { useTransactions } from "@/lib/transaction-context";
import { toast } from "sonner";

export default function StatementUploader() {
  const { user } = useAuth();
  const { handleUpload } = useTransactions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!user) return;
      setValidation(null);

      const content = await file.text();

      // ✅ Validate first
      const result = validateCSVStructure(content);
      setValidation(result);

      if (!result.valid) {
        toast.error("CSV validation failed. Please fix the errors and re-upload.");
        return;
      }

      if (result.warnings.length > 0) {
        toast.warning(`CSV has ${result.warnings.length} warning(s) — processing anyway.`);
      }

      // ✅ Your original logic
      const transactions = parseCSV(content);

      if (transactions.length === 0) {
        toast.error("No transactions found. Please check the CSV format.");
        return;
      }

      const totalCredit = transactions
        .filter((t) => t.type === "credit")
        .reduce((s, t) => s + t.amount, 0);

      const totalDebit = transactions
        .filter((t) => t.type === "debit")
        .reduce((s, t) => s + t.amount, 0);

      const upload: StatementUpload = {
        id: crypto.randomUUID(),
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        transactions,
        totalCredit,
        totalDebit,
      };

      addStatement(user.id, upload);
      handleUpload();
      toast.success(`Parsed ${transactions.length} transactions`);
    },
    [user, handleUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">

      {/* ✅ Template download bar */}
      <div className="stat-card flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Download Sample Statement</p>
            <p className="text-xs text-muted-foreground">
              Use this format to ensure all required columns are present
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            downloadTemplate();
          }}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/5 shrink-0"
        >
          <Download className="h-4 w-4" />
          Download template
        </Button>
      </div>

      {/* Upload area — your original */}
      <div
        className="stat-card flex flex-col items-center justify-center gap-4 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer min-h-[200px]"
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
          <Upload className="h-6 w-6 text-accent-foreground" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground">Upload Bank Statement</p>
          <p className="text-sm text-muted-foreground mt-1">
            Drag & drop a CSV file or click to browse
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Select CSV File
        </Button>
      </div>

      {/* ✅ Validation feedback */}
      {validation && (
        <div className="stat-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validation.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-semibold text-sm">
                {validation.valid ? "CSV structure is valid" : "CSV validation failed"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setValidation(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {validation.errors.length > 0 && (
            <div className="space-y-1">
              {validation.errors.map((err, i) => (
                <p key={i} className="text-sm text-destructive flex items-start gap-2">
                  <span className="mt-0.5">•</span> {err}
                </p>
              ))}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="space-y-1">
              {validation.warnings.map((warn, i) => (
                <p key={i} className="text-sm text-yellow-600 dark:text-yellow-400 flex items-start gap-2">
                  <span className="mt-0.5">•</span> {warn}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
