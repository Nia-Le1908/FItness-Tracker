import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkoutSetInput, WorkoutSetLog } from "@/types";

interface WorkoutSetRow {
  id: string;
  workout_date: string;
  recorded_at: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number;
}

export async function fetchWorkoutSetLogs(
  supabase: SupabaseClient,
  userId: string,
  options: { workoutDate?: string; exerciseName?: string; limit?: number } = {}
): Promise<WorkoutSetLog[]> {
  let query = supabase
    .from("workout_sets")
    .select("id, workout_date, recorded_at, exercise_name, set_number, reps, weight_kg")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false });

  if (options.workoutDate) {
    query = query.eq("workout_date", options.workoutDate);
  }

  if (options.exerciseName) {
    query = query.eq("exercise_name", options.exerciseName);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data as WorkoutSetRow[] | null | undefined ?? []).map((row) => toWorkoutSetLog(row));
}

export async function createWorkoutSetLog(
  supabase: SupabaseClient,
  userId: string,
  input: WorkoutSetInput
): Promise<WorkoutSetLog> {
  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      user_id: userId,
      workout_date: input.workoutDate,
      exercise_name: input.exerciseName,
      set_number: input.setNumber,
      reps: input.reps,
      weight_kg: input.weightKg,
      notes: input.notes,
      session_id: input.sessionId ?? null
    })
    .select("id, workout_date, recorded_at, exercise_name, set_number, reps, weight_kg")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toWorkoutSetLog(data as WorkoutSetRow);
}

function toWorkoutSetLog(row: WorkoutSetRow): WorkoutSetLog {
  return {
    id: row.id,
    workoutDate: row.workout_date,
    recordedAt: row.recorded_at,
    exerciseName: row.exercise_name,
    setNumber: Number(row.set_number),
    reps: Number(row.reps),
    weightKg: Number(row.weight_kg)
  };
}

export async function updateWorkoutSetLog(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  patch: { setNumber?: number; reps?: number; weightKg?: number }
): Promise<WorkoutSetLog> {
  const updates: Record<string, unknown> = {};
  if (patch.setNumber !== undefined) updates.set_number = patch.setNumber;
  if (patch.reps !== undefined) updates.reps = patch.reps;
  if (patch.weightKg !== undefined) updates.weight_kg = patch.weightKg;

  const { data, error } = await supabase
    .from("workout_sets")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, workout_date, recorded_at, exercise_name, set_number, reps, weight_kg")
    .single();

  if (error) throw new Error(error.message);
  return toWorkoutSetLog(data as WorkoutSetRow);
}

export async function deleteWorkoutSetLog(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
