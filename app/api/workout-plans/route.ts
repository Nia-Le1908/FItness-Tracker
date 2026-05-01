import { requireAuth } from "@/lib/api/auth-guard";
import { jsonError, jsonSuccess } from "@/lib/api/http";
import { parseJsonBody, requireString } from "@/lib/api/validation";
import { createWorkoutPlan, createWorkoutPlanVersion, ensureWorkoutPlanOwnership, fetchLatestWorkoutPlanVersion, fetchWorkoutPlanVersions } from "@/services/workout-plans";
import type { WorkoutPlan } from "@/types";

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

      const version = await fetchLatestWorkoutPlanVersion(supabase, userId);
      return jsonSuccess({ version });
    }

    const versions = await fetchWorkoutPlanVersions(supabase, userId, planId, 20);

    return jsonSuccess({ versions });
  } catch (error) {
    const message = error instanceof Error && error.message === "Unauthorized." ? error.message : "Unable to load workout plans.";
    return jsonError(message, error instanceof Error && error.message === "Unauthorized." ? 401 : 500, error instanceof Error && error.message === "Unauthorized." ? "UNAUTHORIZED" : "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);

    const body = parseJsonBody(await request.json());
    const name = requireString(body.name, "name");
    const plan = body.plan as WorkoutPlan;

    if (!plan || !Array.isArray(plan.days)) {
      return jsonError("plan must include days.", 400, "BAD_REQUEST");
    }

    const source = typeof body.source === "string" ? body.source : undefined;
    const planId = typeof body.planId === "string" && body.planId.trim().length > 0 ? body.planId.trim() : undefined;

    let finalPlanId = planId;

    if (!finalPlanId) {
      const created = await createWorkoutPlan(supabase, userId, name);
      finalPlanId = created.id;
    } else {
      await ensureWorkoutPlanOwnership(supabase, userId, finalPlanId);
    }

    const version = await createWorkoutPlanVersion(supabase, userId, finalPlanId, plan, source);

    return jsonSuccess({ planId: finalPlanId, version }, 201);
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "Unauthorized.";
    return jsonError(
      isUnauthorized ? error.message : error instanceof Error ? error.message : "Unable to save workout plan.",
      isUnauthorized ? 401 : 400,
      isUnauthorized ? "UNAUTHORIZED" : "BAD_REQUEST"
    );
  }
}