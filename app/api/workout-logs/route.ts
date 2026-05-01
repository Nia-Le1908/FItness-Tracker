import { requireAuth } from "@/lib/api/auth-guard";
import { jsonError, jsonSuccess } from "@/lib/api/http";
import { parseJsonBody, requireNumber, requireString } from "@/lib/api/validation";
import { createWorkoutSetLog, fetchWorkoutSetLogs } from "@/services/workout-logs";
import type { WorkoutSetInput } from "@/types";

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
    const message = error instanceof Error && error.message === "Unauthorized." ? error.message : "Unable to load workout logs.";
    return jsonError(message, error instanceof Error && error.message === "Unauthorized." ? 401 : 500, error instanceof Error && error.message === "Unauthorized." ? "UNAUTHORIZED" : "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth(request);

    const body = parseJsonBody(await request.json());
    const workoutDate = typeof body.workoutDate === "string" && body.workoutDate.trim().length > 0
      ? requireString(body.workoutDate, "workoutDate")
      : new Date().toISOString().slice(0, 10);

    const input: WorkoutSetInput = {
      workoutDate,
      exerciseName: requireString(body.exerciseName, "exerciseName"),
      setNumber: requireNumber(body.setNumber, "setNumber"),
      reps: requireNumber(body.reps, "reps"),
      weightKg: requireNumber(body.weightKg, "weightKg"),
      notes: typeof body.notes === "string" && body.notes.trim().length > 0
        ? requireString(body.notes, "notes")
        : undefined
    };

    const entry = await createWorkoutSetLog(supabase, userId, input);

    return jsonSuccess({ entry }, 201);
  } catch (error) {
    const isUnauthorized = error instanceof Error && error.message === "Unauthorized.";
    return jsonError(
      isUnauthorized ? error.message : error instanceof Error ? error.message : "Unable to save workout log.",
      isUnauthorized ? 401 : 400,
      isUnauthorized ? "UNAUTHORIZED" : "BAD_REQUEST"
    );
  }
}