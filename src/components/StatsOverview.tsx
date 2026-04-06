import { ArrowDownLeft, ArrowUpRight, CreditCard, Hash } from "lucide-react";
import type { Transaction } from "@/lib/statement-store";

interface Props {
  transactions: Transaction[];
}

export default function StatsOverview({ transactions }: Props) {
  const totalDebit = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const totalCredit = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const txCount = transactions.length;
  const avgTx = txCount > 0 ? totalDebit / transactions.filter((t) => t.type === "debit").length : 0;

  const stats = [
    { label: "Total Spent", value: `₹${Math.round(totalDebit).toLocaleString()}`, icon: ArrowUpRight, color: "text-chart-expense" },
    { label: "Total Received", value: `₹${Math.round(totalCredit).toLocaleString()}`, icon: ArrowDownLeft, color: "text-chart-income" },
    { label: "Transactions", value: txCount.toString(), icon: Hash, color: "text-primary" },
    { label: "Avg Expense", value: `₹${Math.round(avgTx).toLocaleString()}`, icon: CreditCard, color: "text-chart-upi" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
          </div>
          <p className="text-2xl font-bold font-mono">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
