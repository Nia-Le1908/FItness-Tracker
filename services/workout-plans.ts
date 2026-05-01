import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkoutPlan, WorkoutPlanVersion } from "@/types";

interface WorkoutPlanRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface WorkoutPlanVersionRow {
  id: string;
  plan_id: string;
  created_at: string;
  source: string | null;
  plan_json: WorkoutPlan;
}

export async function createWorkoutPlan(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<WorkoutPlanRow> {
  const { data, error } = await supabase
    .from("workout_plans")
    .insert({ user_id: userId, name })
    .select("id, name, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkoutPlanRow;
}

export async function ensureWorkoutPlanOwnership(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Plan not found.");
  }
}

export async function createWorkoutPlanVersion(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  plan: WorkoutPlan,
  source: string | undefined
): Promise<WorkoutPlanVersion> {
  const { data, error } = await supabase
    .from("workout_plan_versions")
    .insert({
      user_id: userId,
      plan_id: planId,
      source: source ?? null,
      plan_json: plan
    })
    .select("id, plan_id, created_at, source, plan_json")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toWorkoutPlanVersion(data as WorkoutPlanVersionRow);
}

export async function fetchWorkoutPlanVersions(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  limit = 20
): Promise<WorkoutPlanVersion[]> {
  const { data, error } = await supabase
    .from("workout_plan_versions")
    .select("id, plan_id, created_at, source, plan_json")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => toWorkoutPlanVersion(row as WorkoutPlanVersionRow));
}

export async function fetchLatestWorkoutPlanVersion(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkoutPlanVersion | null> {
  const { data, error } = await supabase
    .from("workout_plan_versions")
    .select("id, plan_id, created_at, source, plan_json")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return toWorkoutPlanVersion(data as WorkoutPlanVersionRow);
}

function toWorkoutPlanVersion(row: WorkoutPlanVersionRow): WorkoutPlanVersion {
  return {
    id: row.id,
    planId: row.plan_id,
    createdAt: row.created_at,
    source: row.source,
    plan: row.plan_json
  };
}
