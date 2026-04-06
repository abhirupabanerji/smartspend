import { useTransactions } from "@/lib/transaction-context";
import StatementUploader from "@/components/StatementUploader";
import StatsOverview from "@/components/StatsOverview";
import ExpenseCharts from "@/components/ExpenseCharts";
import TransactionTable from "@/components/TransactionTable";

export default function DashboardHome() {
  const { selectedId, selectedTransactions, handleUpload } = useTransactions();

  return (
    <>
      <StatementUploader />

      {selectedId && selectedTransactions.length > 0 && (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-3">
              {selectedId ? "Statement Overview" : "All Statements Overview"}
            </h2>
            <StatsOverview transactions={selectedTransactions} />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Expense Analytics</h2>
            <ExpenseCharts transactions={selectedTransactions} />
          </div>

          <TransactionTable transactions={selectedTransactions} />
        </>
      )}
    </>
  );
}
