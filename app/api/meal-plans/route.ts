import { requireAuth } from "@/lib/api/auth-guard";
import { jsonError, jsonSuccess } from "@/lib/api/http";
import { parseJsonBody, requireNumber, requireString } from "@/lib/api/validation";
import { createMealPlan, createMealPlanVersion, ensureMealPlanOwnership, fetchLatestMealPlanVersion, fetchMealPlanVersions } from "@/services/meal-plans";
import type { MealMacroTargets, MealPlanResult, MealPlanSnapshot } from "@/types";

function parseMealPlanSnapshot(body: Record<string, unknown>): MealPlanSnapshot {
  const targetMacros = body.targetMacros as MealMacroTargets;
  const plan = body.plan as MealPlanResult;

  if (!targetMacros || !plan) {
    throw new Error("targetMacros and plan are required.");
  }

  return {
    budgetVnd: requireNumber(body.budgetVnd, "budgetVnd"),
    targetMacros: {
      calories: requireNumber(targetMacros.calories, "targetMacros.calories"),
      proteinGrams: requireNumber(targetMacros.proteinGrams, "targetMacros.proteinGrams"),
      carbsGrams: requireNumber(targetMacros.carbsGrams, "targetMacros.carbsGrams"),
      fatGrams: requireNumber(targetMacros.fatGrams, "targetMacros.fatGrams")
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
        return jsonError("planId is required.", 400, "BAD_REQUEST");
      }

      const version = await fetchLatestMealPlanVersion(supabase, userId);
      return jsonSuccess({ version });
    }

    const versions = await fetchMealPlanVersions(supabase, userId, planId, 20);
    return jsonSuccess({ versions });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized." ? error.message : "Unable to load meal plans.";
    return jsonError(message, error instanceof Error && error.message === "Unauthorized." ? 401 : 500, error instanceof Error && error.message === "Unauthorized." ? "UNAUTHORIZED" : "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);

    const body = parseJsonBody(await request.json());
    const name = requireString(body.name, "name");
    const snapshot = parseMealPlanSnapshot(body as Record<string, unknown>);
    const source = typeof body.source === "string" ? body.source : undefined;
    const planId = typeof body.planId === "string" && body.planId.trim().length > 0 ? body.planId.trim() : undefined;

    let finalPlanId = planId;

    if (!finalPlanId) {
      const created = await createMealPlan(supabase, userId, name);
      finalPlanId = created.id;
    } else {
      await ensureMealPlanOwnership(supabase, userId, finalPlanId);
    }

    const version = await createMealPlanVersion(supabase, userId, finalPlanId, snapshot, source);
    return jsonSuccess({ planId: finalPlanId, version }, 201);
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "Unauthorized.";
    return jsonError(
      isUnauthorized ? error.message : error instanceof Error ? error.message : "Unable to save meal plan.",
      isUnauthorized ? 401 : 400,
      isUnauthorized ? "UNAUTHORIZED" : "BAD_REQUEST"
    );
  }
}