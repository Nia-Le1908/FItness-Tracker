import type { SupabaseClient } from "@supabase/supabase-js";

import { ForbiddenError } from "@/lib/api/route-errors";
import { getPlanLimit, hasPremiumAccess, type PlanTier } from "@/lib/premium";

export type SavedPlanTable = "workout_plans" | "meal_plans" | "macro_plans";

/**
 * Resolve the caller's billing tier from the database (server-side).
 *
 * The query runs through the user-scoped route client, so RLS
 * (`billing_entitlements_select_own`) only ever returns the caller's own row.
 * Client-controlled state (localStorage, request body) is never consulted,
 * so a user cannot self-promote to premium.
 */
export async function resolveUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<PlanTier> {
  const { data, error } = await supabase
    .from("billing_entitlements")
    .select("tier,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return "free";
  }

  if (data.status !== "active" && data.status !== "trialing") {
    return "free";
  }

  return data.tier === "annual" ? "annual" : "premium";
}

/**
 * Enforce the free-tier saved-plan limit before creating a NEW plan.
 *
 * Only the free tier is capped (`planLimits.savedPlans`); premium/annual
 * tiers are unlimited and skip the count query entirely.
 *
 * @throws ForbiddenError when a free user already has `savedPlans` plans
 */
export async function assertSavedPlanLimit(
  supabase: SupabaseClient,
  userId: string,
  table: SavedPlanTable
): Promise<PlanTier> {
  const tier = await resolveUserTier(supabase, userId);

  if (hasPremiumAccess(tier)) {
    return tier;
  }

  const limit = getPlanLimit("free", "savedPlans");
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  if ((count ?? 0) >= limit) {
    throw new ForbiddenError(
      "You have reached the free plan limit. Upgrade to premium to save more plans."
    );
  }

  return tier;
}
