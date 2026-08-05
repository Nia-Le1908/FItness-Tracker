import type { MacroTargets } from "./macro";

export type FoodCategory = "protein" | "starch" | "vegetable" | "fruit" | "fat" | "dairy" | "snack" | "other";

export type DietaryTag = "high-protein" | "low-fat" | "vegetarian" | "gluten-free" | "lactose-free" | "high-fiber";

export interface FoodServing {
  label: string;
  grams: number;
}

export interface MealFood {
  id: string;
  name: string;
  nameVi?: string;
  aliases?: string[];
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  costPer100gVnd: number;
  category?: FoodCategory;
  tags?: DietaryTag[];
  servings?: FoodServing[];
  source?: string;
  /** Confidence level: verified | estimated | user */
  confidence?: "verified" | "estimated" | "user";
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
  /**
   * Per-entry macros (added to support snapshot recalculation when entries
   * are edited in the meal planner UI). These default to 0 when unknown
   * (e.g. ad-hoc custom entries added by the user).
   */
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
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