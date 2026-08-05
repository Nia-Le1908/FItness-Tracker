import { requireAuth } from "@/lib/api/auth-guard";
import { jsonSuccess } from "@/lib/api/http";
import { handleApiError, isUnauthorizedError } from "@/lib/api/route-errors";
import { parseJsonBody, requireNumber, requireString } from "@/lib/api/validation";
import { apiDefaults } from "@/lib/constants";
import { createWorkoutSetLog, deleteWorkoutSetLog, fetchWorkoutSetLogs, updateWorkoutSetLog } from "@/services/workout-logs";
import type { WorkoutSetInput } from "@/types";

const isoDateLength = 10;

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const workoutDate = searchParams.get("date") ?? undefined;
    const exerciseName = searchParams.get("exerciseName") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const entries = await fetchWorkoutSetLogs(supabase, userId, {
      workoutDate,
      exerciseName,
      limit: Number.isFinite(limit) ? limit : undefined
    });

    return jsonSuccess({ entries });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to load workout logs.", apiDefaults.internalErrorStatus, "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);

    const body = parseJsonBody(await request.json());
    const workoutDate = typeof body.workoutDate === "string" && body.workoutDate.trim().length > 0
      ? requireString(body.workoutDate, "workoutDate")
      : new Date().toISOString().slice(0, isoDateLength);

    const input: WorkoutSetInput = {
      workoutDate,
      exerciseName: requireString(body.exerciseName, "exerciseName"),
      setNumber: requireNumber(body.setNumber, "setNumber"),
      reps: requireNumber(body.reps, "reps"),
      weightKg: requireNumber(body.weightKg, "weightKg"),
      notes: typeof body.notes === "string" && body.notes.trim().length > 0
        ? requireString(body.notes, "notes")
        : undefined,
      sessionId: typeof body.sessionId === "string" && body.sessionId.trim().length > 0
        ? body.sessionId
        : undefined,
      rpe: typeof body.rpe === "number" ? body.rpe : undefined,
      rir: typeof body.rir === "number" ? body.rir : undefined
    };

    const entry = await createWorkoutSetLog(supabase, userId, input);

    return jsonSuccess({ entry }, apiDefaults.createdStatus);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }

    return handleApiError(error, "Unable to save workout log.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const body = parseJsonBody(await request.json());
    const id = requireString(body.id, "id");

    const setNumber = typeof body.setNumber === "number" ? requireNumber(body.setNumber, "setNumber") : undefined;
    const reps = typeof body.reps === "number" ? requireNumber(body.reps, "reps") : undefined;
    const weightKg = typeof body.weightKg === "number" ? requireNumber(body.weightKg, "weightKg") : undefined;

    if (setNumber === undefined && reps === undefined && weightKg === undefined) {
      return handleApiError(new Error("At least one field (setNumber, reps, weightKg) is required."), "Missing fields.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    const entry = await updateWorkoutSetLog(supabase, userId, id, { setNumber, reps, weightKg });
    return jsonSuccess({ entry });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to update workout log.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return handleApiError(new Error("id query parameter is required."), "Missing id.", apiDefaults.badRequestStatus, "BAD_REQUEST");
    }

    await deleteWorkoutSetLog(supabase, userId, id);
    return jsonSuccess({ ok: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return handleApiError(error, "Unauthorized.", apiDefaults.unauthorizedStatus, "UNAUTHORIZED");
    }
    return handleApiError(error, "Unable to delete workout log.", apiDefaults.badRequestStatus, "BAD_REQUEST");
  }
}
