export type PlanTier = "free" | "premium" | "annual";

export const planTiers: PlanTier[] = ["free", "premium", "annual"];

export const premiumFeatures = {
  unlimitedPlans: "unlimited-plans",
  exportData: "export-data",
  cloudBackup: "cloud-backup",
  monthlyAnalytics: "monthly-analytics",
  advancedWorkoutPeriodization: "advanced-workout-periodization"
} as const;

export type PremiumFeatureKey = keyof typeof premiumFeatures;

export const freeFeatureLimits = {
  savedPlanHistory: 1,
  dashboardEntriesPreview: 5,
  progressChartDays: 30
} as const;

/**
 * Server-enforced limits. These are checked in API routes (not just UI),
 * so editing client state (e.g. localStorage) cannot bypass them.
 */
export const planLimits = {
  savedPlans: 1
} as const;

export type PlanLimitKey = keyof typeof planLimits;

export function getPlanLimit(tier: PlanTier | null | undefined, limitKey: PlanLimitKey) {
  if (hasPremiumAccess(tier)) {
    return Infinity;
  }
  return planLimits[limitKey];
}

export function hasPremiumAccess(tier: PlanTier | null | undefined) {
  return tier === "premium" || tier === "annual";
}

export function canUseFeature(tier: PlanTier | null | undefined, feature: PremiumFeatureKey) {
  if (hasPremiumAccess(tier)) {
    return true;
  }

  return feature !== "cloudBackup";
}
