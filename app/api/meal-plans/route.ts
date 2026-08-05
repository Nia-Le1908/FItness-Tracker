import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { assertSavedPlanLimit } from "@/lib/api/premium-guard";
import { assertRequestBody, toOptionalPositiveNumber, toTrimmedString } from "@/lib/api/validation";
import { apiDefaults, mealPlannerLimits } from "@/lib/constants";
import { createMealPlan, createMealPlanVersion, ensureMealPlanOwnership, fetchLatestMealPlanVersion, fetchMealPlanVersions } from "@/services/meal-plans";
import type { MealMacroTargets, MealPlanResult, MealPlanSnapshot } from "@/types";

function parseMealPlanSnapshot(body: Record<string, unknown>): MealPlanSnapshot {
  const targetMacros = body.targetMacros as MealMacroTargets;
  const plan = body.plan as MealPlanResult;

  if (!targetMacros || !plan) {
    throw new Error("targetMacros and plan are required.");
  }

  return {
    budgetVnd: toOptionalPositiveNumber(body.budgetVnd) ?? 0,
    targetMacros: {
      calories: toOptionalPositiveNumber(targetMacros.calories) ?? 0,
      proteinGrams: toOptionalPositiveNumber(targetMacros.proteinGrams) ?? 0,
      carbsGrams: toOptionalPositiveNumber(targetMacros.carbsGrams) ?? 0,
      fatGrams: toOptionalPositiveNumber(targetMacros.fatGrams) ?? 0
    },
    plan
  };
}

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");
    const latest = searchParams.get("latest") === "1";

    if (!planId) {
      if (!latest) {
        return handleApiError(new Error("planId is required."), "planId is required.", apiDefaults.badRequestStatus, "BAD_REQUEST");
      }

      const version = await fetchLatestMealPlanVersion(supabase, userId);
      return jsonSuccess({ version });
    }

    const versions = await fetchMealPlanVersions(supabase, userId, planId, mealPlannerLimits.roundedMealHistoryCount);
    return jsonSuccess({ versions });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to load meal plans.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);

    const body = await request.json();
    assertRequestBody(body);
    const name = toTrimmedString(body.name);
    if (!name) {
      return handleApiError(new Error("name is required."), "name is required.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }
    const snapshot = parseMealPlanSnapshot(body);
    const source = typeof body.source === "string" ? body.source : undefined;
    const planId = typeof body.planId === "string" && body.planId.trim().length > 0 ? body.planId.trim() : undefined;

    let finalPlanId = planId;

    if (!finalPlanId) {
      await assertSavedPlanLimit(supabase, userId, "meal_plans");
      const created = await createMealPlan(supabase, userId, name);
      finalPlanId = created.id;
    } else {
      await ensureMealPlanOwnership(supabase, userId, finalPlanId);
    }

    const version = await createMealPlanVersion(supabase, userId, finalPlanId, snapshot, source);
    return jsonSuccess({ planId: finalPlanId, version }, apiDefaults.createdStatus);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to save meal plan.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}