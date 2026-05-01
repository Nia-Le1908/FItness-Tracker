import type { MacroTargets } from "./macro";

export interface MealFood {
  id: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  costPer100gVnd: number;
}

export type MealMacroTargets = Pick<MacroTargets, "calories" | "proteinGrams" | "carbsGrams" | "fatGrams">;

export interface MealPlanRequest {
  budgetVnd: number;
  targetMacros: MealMacroTargets;
  foods: MealFood[];
}

export interface MealPlanEntry {
  foodId: string;
  foodName: string;
  grams: number;
  calories: number;
  costVnd: number;
}

export interface MealPlanMeal {
  name: string;
  entries: MealPlanEntry[];
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  costVnd: number;
}

export interface MealPlanResult {
  meals: MealPlanMeal[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalCostVnd: number;
  withinBudget: boolean;
  withinMacroTargets: boolean;
}

export interface MealPlanSnapshot {
  budgetVnd: number;
  targetMacros: MealMacroTargets;
  plan: MealPlanResult;
}

export interface MealPlanVersion {
  id: string;
  planId: string;
  createdAt: string;
  source?: string | null;
  snapshot: MealPlanSnapshot;
}