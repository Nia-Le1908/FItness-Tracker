import { buildBudgetMealPlan } from "@/services/meal-planner";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { assertRequestBody, requireNonNegativeNumber, requirePositiveNumber, toOptionalPositiveNumber, toTrimmedString } from "@/lib/api/validation";
import { apiDefaults } from "@/lib/constants";
import type { MealFood } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    assertRequestBody(body);
    const budgetVnd = toOptionalPositiveNumber(body.budgetVnd);
    const calories = toOptionalPositiveNumber(body.calories ?? body.targetCalories);
    const proteinGrams = toOptionalPositiveNumber(body.proteinGrams);
    const carbsGrams = toOptionalPositiveNumber(body.carbsGrams);
    const fatGrams = toOptionalPositiveNumber(body.fatGrams);

    if (!budgetVnd || !calories || !proteinGrams || !carbsGrams || !fatGrams) {
      return handleApiError(new Error("Missing meal inputs."), "Missing meal inputs.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    const foods = Array.isArray(body.foods)
      ? body.foods.map((food, index) => {
          if (typeof food !== "object" || food === null || Array.isArray(food)) {
            throw new Error(`foods[${index}] must be an object.`);
          }

          const record = food as Record<string, unknown>;
          const foodPath = `foods[${index}]`;

          // Each property is required and must be a positive number|string.
          // requirePositiveNumber throws on invalid input, which is caught by
          // the outer try/catch and converted into a BAD_REQUEST response,
          // preventing null from silently flowing into the meal planner.
          // Calories and cost must be strictly positive; macros (protein, carbs,
          // fat) may be zero for pure foods like oil (0 g protein) or chicken (0 g carbs).
          return {
            id: toTrimmedString(record.id) || `food-${index}`,
            name: toTrimmedString(record.name) || `Food ${index + 1}`,
            caloriesPer100g: requirePositiveNumber(record.caloriesPer100g, `${foodPath}.caloriesPer100g`),
            proteinPer100g: requireNonNegativeNumber(record.proteinPer100g, `${foodPath}.proteinPer100g`),
            carbsPer100g: requireNonNegativeNumber(record.carbsPer100g, `${foodPath}.carbsPer100g`),
            fatPer100g: requireNonNegativeNumber(record.fatPer100g, `${foodPath}.fatPer100g`),
            costPer100gVnd: requirePositiveNumber(record.costPer100gVnd, `${foodPath}.costPer100gVnd`)
          } satisfies MealFood;
        })
      : [];

    if (foods.length === 0) {
      return handleApiError(new Error("foods must contain at least one item."), "foods must contain at least one item.", apiDefaults.badRequestStatus, "BAD_REQUEST");
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
    return handleApiError(error, "Unable to generate meal plan.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
