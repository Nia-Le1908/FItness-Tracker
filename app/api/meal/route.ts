import { buildBudgetMealPlan } from "@/services/meal-planner";
import { jsonError, jsonSuccess } from "@/lib/api/http";
import { parseJsonBody, requireNumber, requireString } from "@/lib/api/validation";
import type { MealFood } from "@/types";

export async function POST(request: Request) {
  try {
    const body = parseJsonBody(await request.json());
    const budgetVnd = requireNumber(body.budgetVnd, "budgetVnd");
    const calories = requireNumber(body.calories ?? body.targetCalories, "calories");
    const proteinGrams = requireNumber(body.proteinGrams, "proteinGrams");
    const carbsGrams = requireNumber(body.carbsGrams, "carbsGrams");
    const fatGrams = requireNumber(body.fatGrams, "fatGrams");

    const foods = Array.isArray(body.foods)
      ? body.foods.map((food, index) => {
          if (typeof food !== "object" || food === null || Array.isArray(food)) {
            throw new Error(`foods[${index}] must be an object.`);
          }

          return {
            id: requireString((food as Record<string, unknown>).id, `foods[${index}].id`),
            name: requireString((food as Record<string, unknown>).name, `foods[${index}].name`),
            caloriesPer100g: requireNumber((food as Record<string, unknown>).caloriesPer100g, `foods[${index}].caloriesPer100g`),
            proteinPer100g: requireNumber((food as Record<string, unknown>).proteinPer100g, `foods[${index}].proteinPer100g`),
            carbsPer100g: requireNumber((food as Record<string, unknown>).carbsPer100g, `foods[${index}].carbsPer100g`),
            fatPer100g: requireNumber((food as Record<string, unknown>).fatPer100g, `foods[${index}].fatPer100g`),
            costPer100gVnd: requireNumber((food as Record<string, unknown>).costPer100gVnd, `foods[${index}].costPer100gVnd`)
          } satisfies MealFood;
        })
      : [];

    if (foods.length === 0) {
      return jsonError("foods must contain at least one item.", 400, "BAD_REQUEST");
    }

    const result = buildBudgetMealPlan({
      budgetVnd,
      targetMacros: {
        calories,
        proteinGrams,
        carbsGrams,
        fatGrams
      },
      foods
    });

    return jsonSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate meal plan.";
    return jsonError(message, 400, "BAD_REQUEST");
  }
}
