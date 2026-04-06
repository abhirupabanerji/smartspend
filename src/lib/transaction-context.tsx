import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getStatements,
  deleteStatement,
  type StatementUpload,
  type Transaction,
} from "@/lib/statement-store";

interface TransactionContextType {
  uploads: StatementUpload[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  selectedTransactions: Transaction[];
  allTransactions: Transaction[];
  selectedFileName: string | null;
  refresh: () => void;
  handleUpload: () => void;
  removeSelected: () => void;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx)
    throw new Error("useTransactions must be used within TransactionProvider");
  return ctx;
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [uploads, setUploads] = useState<StatementUpload[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const data = getStatements(user.id);
      setUploads(data);
      // no auto-select — user controls selection
    }
  }, [user]);

  const refresh = useCallback(() => {
    if (!user) return;
    const data = getStatements(user.id);
    setUploads(data);
  }, [user]);

  const handleUpload = useCallback(() => {
    if (!user) return;
    const data = getStatements(user.id);
    setUploads(data);
    setSelectedId(data[0]?.id ?? null);
  }, [user]);

  const removeSelected = useCallback(() => {
    if (!user || !selectedId) return;
    deleteStatement(user.id, selectedId);
    const data = getStatements(user.id);
    setUploads(data);
    setSelectedId(data.length > 0 ? data[0].id : null);
  }, [user, selectedId]);

  const selectedTransactions = useMemo(() => {
  if (!selectedId) return [];
  return uploads.find((u) => u.id === selectedId)?.transactions ?? [];
}, [uploads, selectedId]);

  const selectedFileName = useMemo(() => {
    if (!selectedId) return null;
    return uploads.find((u) => u.id === selectedId)?.fileName ?? null;
  }, [uploads, selectedId]);

  const allTransactions = useMemo(
    () => uploads.flatMap((u) => u.transactions),
    [uploads]
  );

  return (
    <TransactionContext.Provider
      value={{
        uploads,
        selectedId,
        setSelectedId,
        selectedTransactions,
        allTransactions,
        selectedFileName,
        refresh,
        handleUpload,
        removeSelected,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}
