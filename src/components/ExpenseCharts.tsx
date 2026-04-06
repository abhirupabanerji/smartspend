import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { Transaction } from "@/lib/statement-store";

// ── Colors ─────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: string[] = [
  "hsl(210, 79%, 46%)",   // Rent       — dark blue
  "hsl(200, 80%, 70%)",   // Shopping   — light blue
  "hsl(0, 80%, 65%)",     // Utilities  — red
  "hsl(350, 80%, 80%)",   // Finance    — pink
  "hsl(172, 66%, 40%)",   // Food       — teal
  "hsl(140, 60%, 65%)",   // Travel     — light green
  "hsl(32, 95%, 52%)",    // Misc       — orange
  "hsl(45, 90%, 60%)",    // Bank Tfr   — yellow
  "hsl(262, 52%, 55%)",   // Healthcare — purple
];

const MODE_COLORS: Record<string, string> = {
  CARD:  "hsl(210, 79%, 46%)",
  NEFT:  "hsl(200, 80%, 70%)",
  TXN:   "hsl(0, 80%, 65%)",
  UPI:   "hsl(350, 80%, 80%)",
};
const MODE_FALLBACK = "hsl(200, 18%, 46%)";

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  transactions: Transaction[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const formatINR = (v: number): string => `₹${v.toLocaleString("en-IN")}`;

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 13,
};

const legendLabel = (value: string) => (
  <span style={{ color: "hsl(var(--foreground))", fontSize: 13 }}>{value}</span>
);

// Percentage label rendered inside pie/donut slice
const makePieLabel =
  (minPercent = 0.03) =>
  ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
  }: {
    cx: number; cy: number; midAngle: number;
    innerRadius: number; outerRadius: number; percent: number;
  }): JSX.Element | null => {
    if (percent < minPercent) return null;
    const RAD = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.6;
    return (
      <text
        x={cx + r * Math.cos(-midAngle * RAD)}
        y={cy + r * Math.sin(-midAngle * RAD)}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

// ── Main Component ─────────────────────────────────────────────────────────

export default function ExpenseCharts({ transactions }: Props) {
  const debits = useMemo(
    () => transactions.filter((t) => t.type === "debit"),
    [transactions]
  );

  // Category → total amount
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    debits.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [debits]);

  // Payment mode → count (for donut)
  const modeCountData = useMemo(() => {
    const map: Record<string, number> = {};
    debits.forEach((t) => { map[t.mode] = (map[t.mode] || 0) + 1; });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [debits]);

  // Payment mode → total amount (for vertical bar)
  const modeAmountData = useMemo(() => {
    const map: Record<string, number> = {};
    debits.forEach((t) => { map[t.mode] = (map[t.mode] || 0) + t.amount; });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount);
  }, [debits]);

  if (debits.length === 0) return null;

  const catPieLabel  = makePieLabel(0.02);
  const modePieLabel = makePieLabel(0.02);

  return (
    <div className="space-y-6">

      {/* ── Section 1: Category Distribution ─────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold border-b pb-2 mb-4">
          View category wise transaction distribution
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pie chart — with external legend to the right of pie */}
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="45%"
                    cy="50%"
                    outerRadius={120}
                    paddingAngle={1}
                    dataKey="value"
                    nameKey="name"
                    label={catPieLabel as any}
                    labelLine={false}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatINR(v)}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="square"
                    iconSize={12}
                    formatter={legendLabel}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Horizontal bar chart */}
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ left: 8, right: 48, top: 4, bottom: 16 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "debit", position: "insideBottom", offset: -4, fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={115}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "category", angle: -90, position: "insideLeft", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatINR(v), "Amount"]}
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={tooltipStyle}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                    label={{
                      position: "right",
                      fontSize: 11,
                      fontWeight: 600,
                      fill: "hsl(var(--foreground))",
                      formatter: (v: number) => v.toLocaleString("en-IN"),
                    }}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Section 2: Payment Method Breakdown ──────────────────────── */}
      <div>
        <h3 className="text-base font-semibold border-b pb-2 mb-4">
          Payment Method Breakdown
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Donut chart — "How are you paying?" */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">How are you paying?</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={modeCountData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                    label={modePieLabel as any}
                    labelLine={false}
                  >
                    {modeCountData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={MODE_COLORS[entry.name] ?? MODE_FALLBACK}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="square"
                    iconSize={12}
                    formatter={legendLabel}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vertical bar chart — "Spending by Payment Method" */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Spending by Payment Method (₹)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={modeAmountData}
                  margin={{ left: 8, right: 16, top: 20, bottom: 32 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Payment Method",
                      position: "insideBottom",
                      offset: -16,
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Amount",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatINR(v), "Amount"]}
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    formatter={legendLabel}
                    wrapperStyle={{ paddingTop: 8 }}
                  />
                  <Bar
                    dataKey="amount"
                    name="Payment Method"
                    radius={[6, 6, 0, 0]}
                    label={{
                      position: "top",
                      fontSize: 11,
                      fontWeight: 600,
                      fill: "hsl(var(--foreground))",
                      formatter: (v: number) => v.toLocaleString("en-IN"),
                    }}
                  >
                    {modeAmountData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={MODE_COLORS[entry.name] ?? MODE_FALLBACK}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}