import type { SupabaseClient } from "@supabase/supabase-js";

import type { MealPlanSnapshot, MealPlanVersion } from "@/types";

interface MealPlanRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface MealPlanVersionRow {
  id: string;
  plan_id: string;
  created_at: string;
  source: string | null;
  plan_json: MealPlanSnapshot;
}

export async function createMealPlan(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<MealPlanRow> {
  const { data, error } = await supabase
    .from("meal_plans")
    .insert({ user_id: userId, name })
    .select("id, name, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MealPlanRow;
}

export async function ensureMealPlanOwnership(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Plan not found.");
  }
}

export async function createMealPlanVersion(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  snapshot: MealPlanSnapshot,
  source: string | undefined
): Promise<MealPlanVersion> {
  const { data, error } = await supabase
    .from("meal_plan_versions")
    .insert({
      user_id: userId,
      plan_id: planId,
      source: source ?? null,
      plan_json: snapshot
    })
    .select("id, plan_id, created_at, source, plan_json")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toMealPlanVersion(data as MealPlanVersionRow);
}

export async function fetchMealPlanVersions(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  limit = 20
): Promise<MealPlanVersion[]> {
  const { data, error } = await supabase
    .from("meal_plan_versions")
    .select("id, plan_id, created_at, source, plan_json")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => toMealPlanVersion(row as MealPlanVersionRow));
}

export async function fetchLatestMealPlanVersion(
  supabase: SupabaseClient,
  userId: string
): Promise<MealPlanVersion | null> {
  const { data, error } = await supabase
    .from("meal_plan_versions")
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

  return toMealPlanVersion(data as MealPlanVersionRow);
}

function toMealPlanVersion(row: MealPlanVersionRow): MealPlanVersion {
  return {
    id: row.id,
    planId: row.plan_id,
    createdAt: row.created_at,
    source: row.source,
    snapshot: row.plan_json
  };
}
