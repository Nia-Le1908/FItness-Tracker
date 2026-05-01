export type Goal = "cut" | "maintain" | "bulk";

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export interface MacroInput {
  weightKg: number;
  bodyFatPercent: number;
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

export interface MacroPlanVersion {
  id: string;
  planId: string;
  createdAt: string;
  source?: string | null;
  plan: MacroTargets;
}