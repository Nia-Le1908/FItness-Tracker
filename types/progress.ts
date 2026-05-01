export interface WeightEntry {
  date: string;
  weightKg: number;
}

export interface ProgressSummary {
  startWeightKg: number;
  currentWeightKg: number;
  changeKg: number;
  percentChange: number;
}