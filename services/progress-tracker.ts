import type { ProgressSummary, WeightEntry } from "@/types";

export function summarizeProgress(entries: WeightEntry[]): ProgressSummary | null {
  if (entries.length < 2) {
    return null;
  }

  const [first] = entries;
  const current = entries[entries.length - 1];
  const changeKg = current.weightKg - first.weightKg;
  const percentChange = (changeKg / first.weightKg) * 100;

  return {
    startWeightKg: first.weightKg,
    currentWeightKg: current.weightKg,
    changeKg: Math.round(changeKg * 10) / 10,
    percentChange: Math.round(percentChange * 10) / 10
  };
}