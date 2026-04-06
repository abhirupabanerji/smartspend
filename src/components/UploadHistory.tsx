import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Eye } from "lucide-react";
import { deleteStatement, type StatementUpload } from "@/lib/statement-store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface Props {
  uploads: StatementUpload[];
  onRefresh: () => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export default function UploadHistory({ uploads, onRefresh, onSelect, selectedId }: Props) {
  const { user } = useAuth();

  const handleDelete = (id: string, name: string) => {
    if (!user) return;
    deleteStatement(user.id, id);
    toast.success(`Deleted ${name}`);
    onRefresh();
  };

  if (uploads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No statements uploaded yet. Upload a CSV to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {uploads.map((u) => (
          <div
            key={u.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
              selectedId === u.id ? "border-primary bg-accent" : "border-border hover:bg-muted"
            }`}
            onClick={() => onSelect(u.id)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(u.uploadDate).toLocaleDateString()} · {u.transactions.length} transactions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(u.id);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(u.id, u.fileName);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
