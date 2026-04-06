import { useMemo, useState } from "react";
import { Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown } from "lucide-react";
import type { Transaction } from "@/lib/statement-store";

interface Props {
  transactions: Transaction[];
}

export default function RecurringTransactions({ transactions }: Props) {
  const [open, setOpen] = useState(false);

  const recurring = useMemo(() => {
    const map: Record<string, { description: string; amount: number; count: number }> = {};
    transactions.forEach((t) => {
      const key = t.description.toLowerCase().trim();
      if (!map[key]) {
        map[key] = { description: t.description, amount: t.amount, count: 1 };
      } else {
        map[key].count += 1;
      }
    });
    return Object.values(map)
      .filter((r) => r.count >= 2)
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  if (recurring.length === 0) return null;

  return (
    <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">View Recurring Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
                <TableBody>
              {recurring.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{i}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell className="text-right font-mono">{r.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{r.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </div>
      )
    }

