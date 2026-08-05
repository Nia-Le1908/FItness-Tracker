export type Goal = "cut" | "maintain" | "bulk";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export interface MacroInput {
  weightKg: number;
  /** Now optional: falls back to Mifflin-St Jeor when unknown */
  bodyFatPercent?: number;
  goal: Goal;
  activityLevel: ActivityLevel;
}

export interface MacroTargets {
  leanBodyMassKg: number;
  bmrCalories: number;
  targetCalories: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface MacroRange {
  min: number;
  max: number;
  recommended: number;
}

export interface MacroRecommendation {
  method: "katch-mcardle" | "mifflin-st-jeor";
  assumptions: string[];
  warnings: string[];
  confidence: "high" | "medium" | "low";
  targetCalories: MacroRange;
  proteinGrams: MacroRange;
  fatGrams: MacroRange;
  carbsGrams: MacroRange;
  leanBodyMassKg: number | null;
  bmrCalories: number;
  proteinGramsPerKg: number;
  fatPercentOfCalories: number;
  /** Backward-compatible flat targets */
  targets: MacroTargets;
}

export interface MacroPlanVersion {
  id: string;
  planId: string;
  createdAt: string;
  source?: string | null;
  plan: MacroTargets;
}
