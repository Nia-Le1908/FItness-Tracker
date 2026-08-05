import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { parseJsonBody, requireNumber, requireString, clampString } from "@/lib/api/validation";
import { apiDefaults } from "@/lib/constants";
import { fetchRecentSessions, finishWorkoutSession, startWorkoutSession } from "@/services/workout-sessions";

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 10;
    const sessions = await fetchRecentSessions(supabase, userId, limit);
    return jsonSuccess({ sessions });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to load sessions.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const body = parseJsonBody(await request.json());
    const planId = clampString(body.planId, "planName") || undefined;
    const notes = clampString(body.notes, "notes") || undefined;

    const session = await startWorkoutSession(supabase, userId, { planId, notes });
    return jsonSuccess({ session }, apiDefaults.createdStatus);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to start session.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const body = parseJsonBody(await request.json());
    const id = requireString(body.id, "id");
    const durationSeconds = requireNumber(body.durationSeconds, "durationSeconds");

    const session = await finishWorkoutSession(supabase, userId, id, durationSeconds);
    return jsonSuccess({ session });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to finish session.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
