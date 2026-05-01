import { requireAuth } from "@/lib/api/auth-guard";
import { jsonError, jsonSuccess } from "@/lib/api/http";
import { parseJsonBody, requireNumber, requireString } from "@/lib/api/validation";
import { createMacroPlan, createMacroPlanVersion, ensureMacroPlanOwnership, fetchLatestMacroPlanVersion, fetchMacroPlanVersions } from "@/services/macro-plans";
import type { MacroTargets } from "@/types";

function parseMacroTargets(body: Record<string, unknown>): MacroTargets {
  const calories = requireNumber(body.calories, "calories");
  return {
    leanBodyMassKg: requireNumber(body.leanBodyMassKg ?? 0, "leanBodyMassKg"),
    bmrCalories: requireNumber(body.bmrCalories ?? calories, "bmrCalories"),
    targetCalories: requireNumber(body.targetCalories ?? calories, "targetCalories"),
    calories,
    proteinGrams: requireNumber(body.proteinGrams, "proteinGrams"),
    carbsGrams: requireNumber(body.carbsGrams, "carbsGrams"),
    fatGrams: requireNumber(body.fatGrams, "fatGrams")
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

      const version = await fetchLatestMacroPlanVersion(supabase, userId);
      return jsonSuccess({ version });
    }

    const versions = await fetchMacroPlanVersions(supabase, userId, planId, 20);
    return jsonSuccess({ versions });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized." ? error.message : "Unable to load macro plans.";
    return jsonError(message, error instanceof Error && error.message === "Unauthorized." ? 401 : 500, error instanceof Error && error.message === "Unauthorized." ? "UNAUTHORIZED" : "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);

    const body = parseJsonBody(await request.json());
    const name = requireString(body.name, "name");
    const plan = parseMacroTargets(body.plan as Record<string, unknown>);
    const source = typeof body.source === "string" ? body.source : undefined;
    const planId = typeof body.planId === "string" && body.planId.trim().length > 0 ? body.planId.trim() : undefined;

    let finalPlanId = planId;

    if (!finalPlanId) {
      const created = await createMacroPlan(supabase, userId, name);
      finalPlanId = created.id;
    } else {
      await ensureMacroPlanOwnership(supabase, userId, finalPlanId);
    }

    const version = await createMacroPlanVersion(supabase, userId, finalPlanId, plan, source);
    return jsonSuccess({ planId: finalPlanId, version }, 201);
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "Unauthorized.";
    return jsonError(
      isUnauthorized ? error.message : error instanceof Error ? error.message : "Unable to save macro plan.",
      isUnauthorized ? 401 : 400,
      isUnauthorized ? "UNAUTHORIZED" : "BAD_REQUEST"
    );
  }
}
