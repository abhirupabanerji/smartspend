/**
 * Client-side Isolation Forest–inspired anomaly detection for transactions.
 *
 * We build multiple random trees that recursively split on random features
 * (amount, dayOfWeek, month). Anomalies are isolated in fewer splits →
 * shorter average path length → higher anomaly score.
 */

import type { Transaction } from "./statement-store";

interface ScoredTransaction extends Transaction {
  anomalyScore: number;
  isAnomaly: boolean;
  index: number;
}

// ── Isolation Tree types ──────────────────────────────────────────────
interface ITreeLeaf { type: "leaf"; size: number }
interface ITreeNode { type: "node"; feature: number; splitValue: number; left: ITree; right: ITree }
type ITree = ITreeLeaf | ITreeNode;

// ── Helpers ───────────────────────────────────────────────────────────
function parseDay(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 1 : d.getDay();
}
function parseMonth(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 1 : d.getMonth() + 1;
}

function featureVector(t: Transaction): number[] {
  return [t.amount, parseDay(t.date), parseMonth(t.date)];
}

// Average path length of unsuccessful search in BST (for normalisation)
function c(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  const H = Math.log(n - 1) + 0.5772156649; // Euler-Mascheroni
  return 2 * H - (2 * (n - 1)) / n;
}

// ── Build a single Isolation Tree ─────────────────────────────────────
function buildTree(data: number[][], heightLimit: number, depth: number): ITree {
  if (depth >= heightLimit || data.length <= 1) {
    return { type: "leaf", size: data.length };
  }
  const nFeatures = data[0].length;
  const feat = Math.floor(Math.random() * nFeatures);
  const vals = data.map((r) => r[feat]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) return { type: "leaf", size: data.length };

  const split = min + Math.random() * (max - min);
  const left = data.filter((r) => r[feat] < split);
  const right = data.filter((r) => r[feat] >= split);

  return {
    type: "node",
    feature: feat,
    splitValue: split,
    left: buildTree(left, heightLimit, depth + 1),
    right: buildTree(right, heightLimit, depth + 1),
  };
}

function pathLength(point: number[], tree: ITree, depth: number): number {
  if (tree.type === "leaf") return depth + c(tree.size);
  if (point[tree.feature] < tree.splitValue) return pathLength(point, tree.left, depth + 1);
  return pathLength(point, tree.right, depth + 1);
}

// ── Public API ────────────────────────────────────────────────────────
export function detectAnomalies(
  transactions: Transaction[],
  contamination = 0.05,
  nTrees = 100,
): ScoredTransaction[] {
  if (transactions.length < 4) {
    return transactions.map((t, i) => ({ ...t, anomalyScore: 0, isAnomaly: false, index: i }));
  }

  const vectors = transactions.map(featureVector);
  const n = vectors.length;
  const heightLimit = Math.ceil(Math.log2(n));
  const sampleSize = Math.min(256, n);

  // Build forest
  const trees: ITree[] = [];
  for (let i = 0; i < nTrees; i++) {
    // Sub-sample
    const sample: number[][] = [];
    for (let j = 0; j < sampleSize; j++) {
      sample.push(vectors[Math.floor(Math.random() * n)]);
    }
    trees.push(buildTree(sample, heightLimit, 0));
  }

  // Score each point
  const cN = c(sampleSize);
  const scores = vectors.map((v) => {
    const avgPath = trees.reduce((s, tree) => s + pathLength(v, tree, 0), 0) / nTrees;
    return Math.pow(2, -(avgPath / cN));
  });

  // Determine threshold from contamination
  const sorted = [...scores].sort((a, b) => b - a);
  const thresholdIdx = Math.max(0, Math.floor(contamination * n) - 1);
  const threshold = sorted[thresholdIdx] ?? 0.5;

  return transactions.map((t, i) => ({
    ...t,
    anomalyScore: Math.round(scores[i] * 10000) / 10000,
    isAnomaly: scores[i] >= threshold,
    index: i,
  }));
}