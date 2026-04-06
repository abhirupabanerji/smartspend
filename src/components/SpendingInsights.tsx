import { useMemo } from "react";
import { TrendingUp, Receipt, Calculator } from "lucide-react";
import type { Transaction } from "@/lib/statement-store";

interface Props {
  transactions: Transaction[];
}

export default function SpendingInsights({ transactions }: Props) {
  const insights = useMemo(() => {
    const debits = transactions.filter((t) => t.type === "debit");
    if (debits.length === 0) return null;

    // Top category
    const catMap: Record<string, number> = {};
    debits.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    // Largest transaction
    const largest = debits.reduce((max, t) => (t.amount > max.amount ? t : max), debits[0]);

    // Average spend
    const avg = debits.reduce((s, t) => s + t.amount, 0) / debits.length;

    return { topCat, largest, avg };
  }, [transactions]);

  if (!insights) return null;

  const cards = [
    {
      title: "Top Category",
      value: `₹${Math.round(insights.topCat[1]).toLocaleString()} spent on ${insights.topCat[0]}`,
      icon: TrendingUp,
      bg: "bg-primary/10 border-primary/30",
    },
    {
      title: "Largest Transaction",
      value: `₹${Math.round(insights.largest.amount).toLocaleString()} on ${insights.largest.description}`,
      icon: Receipt,
      bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800/40",
    },
    {
      title: "Average Spend",
      value: `₹${Math.round(insights.avg).toLocaleString()} per transaction`,
      icon: Calculator,
      bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Spending Insights</h2>
      <p className="text-sm text-muted-foreground mb-4">Get quick insights on your spendings</p>
      <hr className="border-primary/40 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.title} className={`rounded-xl border p-5 ${c.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <c.icon className="h-4 w-4 text-foreground/70" />
              <span className="font-semibold text-sm">{c.title}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
