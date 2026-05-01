import { calculateMacroTargets } from "@/services/macro-calculator";
import { jsonError, jsonSuccess } from "@/lib/api/http";
import { parseJsonBody, requireNumber, requireOneOf } from "@/lib/api/validation";

export async function POST(request: Request) {
  try {
    const body = parseJsonBody(await request.json());
    const result = calculateMacroTargets({
      weightKg: requireNumber(body.weightKg, "weightKg"),
      bodyFatPercent: requireNumber(body.bodyFatPercent, "bodyFatPercent"),
      goal: requireOneOf(body.goal, "goal", ["cut", "maintain", "bulk"] as const),
      activityLevel: requireOneOf(body.activityLevel, "activityLevel", ["sedentary", "light", "moderate", "active"] as const)
    });

    return jsonSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to calculate macros.";
    return jsonError(message, 400, "BAD_REQUEST");
  }
}