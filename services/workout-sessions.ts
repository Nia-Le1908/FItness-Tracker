import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkoutSession } from "@/types";

interface SessionRow {
  id: string;
  user_id: string;
  plan_id: string | null;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

export async function startWorkoutSession(
  supabase: SupabaseClient,
  userId: string,
  options?: { planId?: string; notes?: string }
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      plan_id: options?.planId ?? null,
      notes: options?.notes ?? null
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toWorkoutSession(data as SessionRow);
}

export async function finishWorkoutSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  durationSeconds: number
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({
      finished_at: new Date().toISOString(),
      duration_seconds: durationSeconds
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toWorkoutSession(data as SessionRow);
}

export async function fetchWorkoutSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string
): Promise<WorkoutSession | null> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return toWorkoutSession(data as SessionRow);
}

export async function fetchRecentSessions(
  supabase: SupabaseClient,
  userId: string,
  limit = 10
): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as SessionRow[] | null ?? []).map(toWorkoutSession);
}

function toWorkoutSession(row: SessionRow): WorkoutSession {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationSeconds: row.duration_seconds,
    notes: row.notes,
    createdAt: row.created_at
  };
}
