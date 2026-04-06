import { useTransactions } from "@/lib/transaction-context";
import RecurringTransactions from "@/components/RecurringTransactions";

export default function RecurringPage() {
  const { selectedTransactions} = useTransactions();
  const txs = selectedTransactions.length > 0 ? selectedTransactions : selectedTransactions;

  if (txs.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">No transactions yet</p>
        <p className="text-sm mt-1">Upload a bank statement from the Dashboard to see recurring transactions.</p>
      </div>
    );
  }

  return <RecurringTransactions transactions={txs} />;
}
