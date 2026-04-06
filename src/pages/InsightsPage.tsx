import { useTransactions } from "@/lib/transaction-context";
import SpendingInsights from "@/components/SpendingInsights";

export default function InsightsPage() {
  const { selectedTransactions} = useTransactions();
  const txs = selectedTransactions.length > 0 ? selectedTransactions : selectedTransactions;

  if (txs.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">No transactions yet</p>
        <p className="text-sm mt-1">Upload a bank statement from the Dashboard to see insights.</p>
      </div>
    );
  }

  return <SpendingInsights transactions={txs} />;
}
