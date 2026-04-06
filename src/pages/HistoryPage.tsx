import { useTransactions } from "@/lib/transaction-context";
import UploadHistory from "@/components/UploadHistory";
import { useNavigate } from "react-router-dom";

export default function HistoryPage() {
  const { uploads, refresh, selectedId, setSelectedId } = useTransactions();
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
    navigate("/");
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold mb-4">Upload History</h2>
      <UploadHistory
        uploads={uploads}
        onRefresh={refresh}
        onSelect={handleSelect}
        selectedId={selectedId}
      />
    </div>
  );
}