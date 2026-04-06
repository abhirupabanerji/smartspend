import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, HelpCircle, AlertTriangle } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import type { Transaction } from "@/lib/statement-store";
import { detectAnomalies } from "@/lib/anomaly-detection";

interface Props {
  transactions: Transaction[];
}

export default function AnomalyDetection({ transactions }: Props) {
  const [histOpen, setHistOpen] = useState(true);
  const [scatterOpen, setScatterOpen] = useState(true);

  const scored = useMemo(
    () => detectAnomalies(transactions.filter((t) => t.type === "debit"), 0.05),
    [transactions]
  );

  const anomalies = useMemo(() => scored.filter((s) => s.isAnomaly), [scored]);

  // ── Metrics ──
  const anomalyRate = scored.length > 0 ? ((anomalies.length / scored.length) * 100).toFixed(2) : "0";
  const highestAnomaly = anomalies.length > 0
    ? Math.max(...anomalies.map((a) => a.amount))
    : 0;
  const avgScore = scored.length > 0
    ? (scored.reduce((s, t) => s + t.anomalyScore, 0) / scored.length).toFixed(4)
    : "0";
  const avgScoreAnomalies = anomalies.length > 0
    ? (anomalies.reduce((s, t) => s + t.anomalyScore, 0) / anomalies.length).toFixed(4)
    : "0";

  // ── Histogram data ──
  const histData = useMemo(() => {
    if (scored.length === 0) return [];
    const bucketCount = 20;
    const min = Math.min(...scored.map((s) => s.anomalyScore));
    const max = Math.max(...scored.map((s) => s.anomalyScore));
    const range = max - min || 1;
    const step = range / bucketCount;

    const buckets: { range: string; Normal: number; Anomaly: number; mid: number }[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const lo = min + i * step;
      const hi = lo + step;
      const mid = (lo + hi) / 2;
      const label = lo.toFixed(2);
      const inBucket = scored.filter((s) => s.anomalyScore >= lo && (i === bucketCount - 1 ? s.anomalyScore <= hi : s.anomalyScore < hi));
      buckets.push({
        range: label,
        Normal: inBucket.filter((s) => !s.isAnomaly).length,
        Anomaly: inBucket.filter((s) => s.isAnomaly).length,
        mid,
      });
    }
    return buckets;
  }, [scored]);

  // ── Scatter data ──
  const scatterNormal = useMemo(
    () => scored.filter((s) => !s.isAnomaly).map((s) => ({ date: s.date, amount: s.amount, desc: s.description, score: s.anomalyScore })),
    [scored]
  );
  const scatterAnomaly = useMemo(
    () => anomalies.map((s) => ({ date: s.date, amount: s.amount, desc: s.description, score: s.anomalyScore })),
    [anomalies]
  );

  if (scored.length === 0) return null;

  const metrics = [
    { label: "Anomaly Rate", value: `${anomalyRate}%`, help: "Percentage of transactions flagged as anomalies" },
    { label: "Total Anomalies", value: anomalies.length.toString() },
    { label: "Highest Anomaly", value: `₹${highestAnomaly.toLocaleString()}` },
    { label: "Avg Anomaly Score", value: avgScore, help: "Average isolation score across all transactions (higher = more anomalous)" },
    { label: "Avg Score (Anomalies)", value: avgScoreAnomalies },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1">Detect Unusual Patterns in Your Transactions</h2>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <h3 className="text-base font-semibold">Model Evaluation Metrics</h3>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <TooltipProvider>
          {metrics.map((m) => (
            <div key={m.label} className="stat-card">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</span>
                {m.help && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-[200px]">{m.help}</p></TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-2xl font-bold font-mono">{m.value}</p>
            </div>
          ))}
        </TooltipProvider>
      </div>

      <hr className="border-primary/30" />

      {/* Anomaly Score Distribution */}
      <Collapsible open={histOpen} onOpenChange={setHistOpen} className="rounded-xl border border-border bg-card p-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
          <span className="text-sm font-medium">Anomaly Score Distribution</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${histOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={histData} barCategoryGap="10%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} label={{ value: "Score", position: "insideBottom", offset: -2, fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "count", angle: -90, position: "insideLeft", fontSize: 12 }} />
              <ReTooltip />
              <Legend />
              <Bar dataKey="Normal" stackId="a" fill="hsl(210, 80%, 50%)" />
              <Bar dataKey="Anomaly" stackId="a" fill="hsl(200, 70%, 80%)" />
            </BarChart>
          </ResponsiveContainer>
        </CollapsibleContent>
      </Collapsible>

      {/* Anomaly Detection Scatter */}
      <Collapsible open={scatterOpen} onOpenChange={setScatterOpen} className="rounded-xl border border-border bg-card p-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
          <span className="text-sm font-medium">Anomaly Detection</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${scatterOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" name="Date" tick={{ fontSize: 11 }} />
              <YAxis dataKey="amount" name="Debit" tick={{ fontSize: 11 }} label={{ value: "debit", angle: -90, position: "insideLeft", fontSize: 12 }} />
              <ReTooltip
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-md">
                      <p className="font-semibold">{d.desc}</p>
                      <p>₹{d.amount?.toLocaleString()} • {d.date}</p>
                      <p>Score: {d.score}</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Scatter name="Normal" data={scatterNormal} fill="hsl(210, 80%, 45%)" />
              <Scatter name="Anomaly" data={scatterAnomaly} fill="hsl(200, 70%, 75%)" />
            </ScatterChart>
          </ResponsiveContainer>
        </CollapsibleContent>
      </Collapsible>

      {/* Anomaly Table */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Anomalous Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomalies.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{a.index}</TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">{a.date}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{a.description}</TableCell>
                      <TableCell className="text-right font-mono font-medium">₹{a.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{a.category}</Badge></TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{a.mode}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-sm">{a.anomalyScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info note */}
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
        <p className="text-sm text-primary">
          Isolation Forest is used for detecting unusual transactions. It works by isolating observations — anomalies require fewer random splits to isolate, resulting in shorter path lengths and higher anomaly scores.
        </p>
      </div>
    </div>
  );
}
