import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { assertSavedPlanLimit } from "@/lib/api/premium-guard";
import { assertRequestBody, toOptionalPositiveNumber, toTrimmedString } from "@/lib/api/validation";
import { apiDefaults, mealPlannerLimits } from "@/lib/constants";
import { createMacroPlan, createMacroPlanVersion, ensureMacroPlanOwnership, fetchLatestMacroPlanVersion, fetchMacroPlanVersions } from "@/services/macro-plans";
import type { MacroTargets } from "@/types";

function parseMacroTargets(body: Record<string, unknown>): MacroTargets {
  const calories = toOptionalPositiveNumber(body.calories) ?? 0;
  return {
    leanBodyMassKg: toOptionalPositiveNumber(body.leanBodyMassKg ?? 0) ?? 0,
    bmrCalories: toOptionalPositiveNumber(body.bmrCalories ?? calories) ?? calories,
    targetCalories: toOptionalPositiveNumber(body.targetCalories ?? calories) ?? calories,
    calories,
    proteinGrams: toOptionalPositiveNumber(body.proteinGrams) ?? 0,
    carbsGrams: toOptionalPositiveNumber(body.carbsGrams) ?? 0,
    fatGrams: toOptionalPositiveNumber(body.fatGrams) ?? 0
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

      const version = await fetchLatestMacroPlanVersion(supabase, userId);
      return jsonSuccess({ version });
    }

    const versions = await fetchMacroPlanVersions(supabase, userId, planId, mealPlannerLimits.roundedMealHistoryCount);
    return jsonSuccess({ versions });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to load macro plans.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
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
    const plan = parseMacroTargets(body.plan as Record<string, unknown>);
    const source = typeof body.source === "string" ? body.source : undefined;
    const planId = typeof body.planId === "string" && body.planId.trim().length > 0 ? body.planId.trim() : undefined;

    let finalPlanId = planId;

    if (!finalPlanId) {
      await assertSavedPlanLimit(supabase, userId, "macro_plans");
      const created = await createMacroPlan(supabase, userId, name);
      finalPlanId = created.id;
    } else {
      await ensureMacroPlanOwnership(supabase, userId, finalPlanId);
    }

    const version = await createMacroPlanVersion(supabase, userId, finalPlanId, plan, source);
    return jsonSuccess({ planId: finalPlanId, version }, apiDefaults.createdStatus);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to save macro plan.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
