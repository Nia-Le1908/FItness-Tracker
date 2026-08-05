import type { MealFood, MealPlanEntry, MealPlanMeal, MealPlanRequest, MealPlanResult } from "@/types";

type MacroKind = "protein" | "carbs" | "fat";

export function buildBudgetMealPlan(request: MealPlanRequest): MealPlanResult {
  const foods = request.foods.filter((food) => food.costPer100gVnd > 0);
  if (foods.length === 0) {
    return emptyPlan(request.targetMacros);
  }

  const foodMap = new Map(foods.map((food) => [food.id, food] as const));
  const mealCount = chooseMealCount(request.budgetVnd, request.targetMacros.calories);
  const targetPerMeal = {
    calories: request.targetMacros.calories / mealCount,
    proteinGrams: request.targetMacros.proteinGrams / mealCount,
    carbsGrams: request.targetMacros.carbsGrams / mealCount,
    fatGrams: request.targetMacros.fatGrams / mealCount
  };

  const meals: MealPlanMeal[] = [];

  const proteinFoods = [...foods].sort((left, right) => proteinScore(right) - proteinScore(left));
  const carbFoods = [...foods].sort((left, right) => carbScore(right) - carbScore(left));
  const fatFoods = [...foods].sort((left, right) => fatScore(right) - fatScore(left));

  for (let index = 0; index < mealCount; index += 1) {
    const proteinPick = selectFood(proteinFoods, []);
    const carbPick = selectFood(carbFoods, [proteinPick.id]);
    const fatPick = selectFood(fatFoods, [proteinPick.id, carbPick.id]);

    const mealItems = compactEntries(
      [
        portionForMacro(proteinPick, targetPerMeal.proteinGrams * 0.95, "protein"),
        portionForMacro(carbPick, targetPerMeal.carbsGrams * 0.95, "carbs"),
        portionForMacro(fatPick, targetPerMeal.fatGrams * 0.95, "fat")
      ].filter((entry): entry is MealPlanEntry => Boolean(entry))
    );

    const mealTotals = summarizeMeal(mealItems, foodMap);

    meals.push({
      name: `Meal ${index + 1}`,
      entries: mealItems,
      calories: mealTotals.calories,
      proteinGrams: mealTotals.proteinGrams,
      carbsGrams: mealTotals.carbsGrams,
      fatGrams: mealTotals.fatGrams,
      costVnd: mealTotals.costVnd
    });
  }

  const totals = meals.reduce(
    (accumulator, meal) => {
      accumulator.totalCalories += meal.calories;
      accumulator.totalProteinGrams += meal.proteinGrams;
      accumulator.totalCarbsGrams += meal.carbsGrams;
      accumulator.totalFatGrams += meal.fatGrams;
      accumulator.totalCostVnd += meal.costVnd;
      return accumulator;
    },
    { totalCalories: 0, totalProteinGrams: 0, totalCarbsGrams: 0, totalFatGrams: 0, totalCostVnd: 0 }
  );

  return {
    meals,
    ...totals,
    withinBudget: totals.totalCostVnd <= request.budgetVnd,
    withinMacroTargets: withinTenPercent(totals.totalCalories, request.targetMacros.calories) &&
      withinTenPercent(totals.totalProteinGrams, request.targetMacros.proteinGrams) &&
      withinTenPercent(totals.totalCarbsGrams, request.targetMacros.carbsGrams) &&
      withinTenPercent(totals.totalFatGrams, request.targetMacros.fatGrams)
  };
}

function chooseMealCount(budgetVnd: number, calories: number): number {
  if (budgetVnd < 80000 || calories < 1800) {
    return 3;
  }

  if (budgetVnd < 160000 || calories < 2600) {
    return 4;
  }

  return 5;
}

function proteinScore(food: MealFood): number {
  return food.proteinPer100g / food.costPer100gVnd;
}

function carbScore(food: MealFood): number {
  return food.carbsPer100g / food.costPer100gVnd;
}

function fatScore(food: MealFood): number {
  return food.fatPer100g / food.costPer100gVnd;
}

function selectFood(candidates: MealFood[], excludedIds: Array<string | undefined>): MealFood {
  const selected = candidates.find((food) => !excludedIds.includes(food.id));
  if (!selected) {
    throw new Error("Not enough foods to build a meal plan. Add more foods to the list.");
  }
  return selected;
}

function portionForMacro(food: MealFood, targetMacroGrams: number, kind: MacroKind): MealPlanEntry | null {
  const macroPer100g =
    kind === "protein" ? food.proteinPer100g : kind === "carbs" ? food.carbsPer100g : food.fatPer100g;

  if (macroPer100g <= 0) {
    return null;
  }

  const grams = Math.max(Math.round((targetMacroGrams / macroPer100g) * 100), 40);

  return {
    foodId: food.id,
    foodName: food.name,
    grams,
    calories: Math.round((grams / 100) * food.caloriesPer100g),
    costVnd: Math.round((grams / 100) * food.costPer100gVnd)
  };
}

function compactEntries(entries: MealPlanEntry[]): MealPlanEntry[] {
  const merged = new Map<string, MealPlanEntry>();

  for (const entry of entries) {
    const existing = merged.get(entry.foodId);
    if (!existing) {
      merged.set(entry.foodId, entry);
      continue;
    }

    merged.set(entry.foodId, {
      ...existing,
      grams: existing.grams + entry.grams,
      calories: existing.calories + entry.calories,
      costVnd: existing.costVnd + entry.costVnd
    });
  }

  return [...merged.values()];
}

function summarizeMeal(entries: MealPlanEntry[], foodMap: Map<string, MealFood>): {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  costVnd: number;
} {
  return entries.reduce(
    (totals, entry) => {
      const food = foodMap.get(entry.foodId);
      if (!food) {
        return totals;
      }

      const grams = entry.grams / 100;
      totals.calories += Math.round(grams * food.caloriesPer100g);
      totals.proteinGrams += grams * food.proteinPer100g;
      totals.carbsGrams += grams * food.carbsPer100g;
      totals.fatGrams += grams * food.fatPer100g;
      totals.costVnd += Math.round(grams * food.costPer100gVnd);
      return totals;
    },
    { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0, costVnd: 0 }
  );
}

function withinTenPercent(value: number, target: number): boolean {
  return value >= target * 0.9 && value <= target * 1.1;
}

function emptyPlan(targetMacros: MealPlanRequest["targetMacros"]): MealPlanResult {
  return {
    meals: [],
    totalCalories: 0,
    totalProteinGrams: 0,
    totalCarbsGrams: 0,
    totalFatGrams: 0,
    totalCostVnd: 0,
    withinBudget: true,
    withinMacroTargets: false
  };
}