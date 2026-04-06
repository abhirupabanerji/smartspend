import { useCallback, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  parseCSV,
  addStatement,
  type StatementUpload,
} from "@/lib/statement-store";
import { useAuth } from "@/lib/auth-context";
import { useTransactions } from "@/lib/transaction-context"; // ✅ ADD THIS
import { toast } from "sonner";

export default function StatementUploader() {
  const { user } = useAuth();
  const { handleUpload } = useTransactions(); // ✅ USE CONTEXT
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!user) return;

      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
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

        // ✅ Save to localStorage
        addStatement(user.id, upload);

        // ✅ IMPORTANT: update context
        handleUpload();

        toast.success(`Parsed ${transactions.length} transactions`);
      };

      reader.readAsText(file);
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
        <p className="font-semibold text-foreground">
          Upload Bank Statement
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag & drop a CSV file or click to browse
        </p>
      </div>

      <Button variant="outline" size="sm" className="gap-2">
        <FileText className="h-4 w-4" />
        Select CSV File
      </Button>
    </div>
  );
}