import { calculateMacroRecommendation } from "@/services/macro-calculator";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError } from "@/lib/api/route-errors";
import { assertRequestBody, toOptionalPositiveNumber, isAllowedValue } from "@/lib/api/validation";
import { apiDefaults } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    assertRequestBody(body);

    const goal = isAllowedValue(body.goal, ["cut", "maintain", "bulk"] as const) ? body.goal : null;
    const activityLevel = isAllowedValue(body.activityLevel, ["sedentary", "light", "moderate", "active"] as const) ? body.activityLevel : null;

    if (!goal || !activityLevel) {
      throw new Error("Invalid macro request.");
    }

    const weightKg = toOptionalPositiveNumber(body.weightKg) ?? 0;
    const bodyFatPercent = toOptionalPositiveNumber(body.bodyFatPercent) ?? undefined;

    const recommendation = calculateMacroRecommendation({
      weightKg,
      bodyFatPercent,
      goal: goal as "cut" | "maintain" | "bulk",
      activityLevel: activityLevel as "sedentary" | "light" | "moderate" | "active"
    });

    return jsonSuccess(recommendation);
  } catch (error) {
    return handleApiError(error, "Unable to calculate macros.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
