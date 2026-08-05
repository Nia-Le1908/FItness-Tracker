import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { assertSavedPlanLimit } from "@/lib/api/premium-guard";
import { assertRequestBody, toTrimmedString } from "@/lib/api/validation";
import { apiDefaults, mealPlannerLimits } from "@/lib/constants";
import { createWorkoutPlan, createWorkoutPlanVersion, ensureWorkoutPlanOwnership, fetchLatestWorkoutPlanVersion, fetchWorkoutPlanVersions, deleteWorkoutPlan } from "@/services/workout-plans";
import type { WorkoutPlan } from "@/types";

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

      const version = await fetchLatestWorkoutPlanVersion(supabase, userId);
      return jsonSuccess({ version });
    }

    const versions = await fetchWorkoutPlanVersions(supabase, userId, planId, mealPlannerLimits.roundedMealHistoryCount);

    return jsonSuccess({ versions });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to load workout plans.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
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
    const plan = body.plan as WorkoutPlan;

    if (!plan || !Array.isArray(plan.days)) {
      return handleApiError(new Error("plan must include days."), "plan must include days.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    const source = typeof body.source === "string" ? body.source : undefined;
    const planId = typeof body.planId === "string" && body.planId.trim().length > 0 ? body.planId.trim() : undefined;

    let finalPlanId = planId;

    if (!finalPlanId) {
      await assertSavedPlanLimit(supabase, userId, "workout_plans");
      const created = await createWorkoutPlan(supabase, userId, name);
      finalPlanId = created.id;
    } else {
      await ensureWorkoutPlanOwnership(supabase, userId, finalPlanId);
    }

    const version = await createWorkoutPlanVersion(supabase, userId, finalPlanId, plan, source);

    return jsonSuccess({ planId: finalPlanId, version }, apiDefaults.createdStatus);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to save workout plan.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("planId");
    if (!planId) {
      return handleApiError(new Error("planId is required."), "planId is required.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    await deleteWorkoutPlan(supabase, userId, planId);

    return jsonSuccess({ ok: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to delete workout plan.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}