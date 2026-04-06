import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import type { Transaction } from "@/lib/statement-store";

interface Props {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return transactions.slice(0, 100);
    const q = search.toLowerCase();
    return transactions
      .filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.mode.toLowerCase().includes(q)
      )
      .slice(0, 100);
  }, [transactions, search]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">Transactions</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                    {t.date}
                  </TableCell>
                  <TableCell className="text-sm max-w-[250px] truncate">{t.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{t.mode}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{t.category}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm font-medium ${
                    t.type === "debit" ? "text-chart-expense" : "text-chart-income"
                  }`}>
                    {t.type === "debit" ? "-" : "+"}₹{t.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No transactions found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
