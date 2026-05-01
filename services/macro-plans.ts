import type { SupabaseClient } from "@supabase/supabase-js";

import type { MacroPlanVersion, MacroTargets } from "@/types";

interface MacroPlanRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface MacroPlanVersionRow {
  id: string;
  plan_id: string;
  created_at: string;
  source: string | null;
  plan_json: MacroTargets;
}

export async function createMacroPlan(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<MacroPlanRow> {
  const { data, error } = await supabase
    .from("macro_plans")
    .insert({ user_id: userId, name })
    .select("id, name, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MacroPlanRow;
}

export async function ensureMacroPlanOwnership(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("macro_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Plan not found.");
  }
}

export async function createMacroPlanVersion(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  plan: MacroTargets,
  source: string | undefined
): Promise<MacroPlanVersion> {
  const { data, error } = await supabase
    .from("macro_plan_versions")
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

  return toMacroPlanVersion(data as MacroPlanVersionRow);
}

export async function fetchMacroPlanVersions(
  supabase: SupabaseClient,
  userId: string,
  planId: string,
  limit = 20
): Promise<MacroPlanVersion[]> {
  const { data, error } = await supabase
    .from("macro_plan_versions")
    .select("id, plan_id, created_at, source, plan_json")
    .eq("user_id", userId)
    .eq("plan_id", planId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => toMacroPlanVersion(row as MacroPlanVersionRow));
}

export async function fetchLatestMacroPlanVersion(
  supabase: SupabaseClient,
  userId: string
): Promise<MacroPlanVersion | null> {
  const { data, error } = await supabase
    .from("macro_plan_versions")
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

  return toMacroPlanVersion(data as MacroPlanVersionRow);
}

function toMacroPlanVersion(row: MacroPlanVersionRow): MacroPlanVersion {
  return {
    id: row.id,
    planId: row.plan_id,
    createdAt: row.created_at,
    source: row.source,
    plan: row.plan_json
  };
}
