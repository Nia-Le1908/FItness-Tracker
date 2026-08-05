import { hasPremiumAccess, canUseFeature, planTiers, premiumFeatures, freeFeatureLimits } from "@/lib/premium";

describe("hasPremiumAccess", () => {
  it("returns true for premium and annual tiers", () => {
    expect(hasPremiumAccess("premium")).toBe(true);
    expect(hasPremiumAccess("annual")).toBe(true);
  });

  it("returns false for free tier", () => {
    expect(hasPremiumAccess("free")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(hasPremiumAccess(null)).toBe(false);
    expect(hasPremiumAccess(undefined)).toBe(false);
  });
});

describe("canUseFeature", () => {
  it("returns true for all features when premium", () => {
    expect(canUseFeature("premium", "cloudBackup")).toBe(true);
    expect(canUseFeature("annual", "cloudBackup")).toBe(true);
    expect(canUseFeature("premium", "unlimitedPlans")).toBe(true);
  });

  it("returns false for cloudBackup on free tier", () => {
    expect(canUseFeature("free", "cloudBackup")).toBe(false);
  });

  it("returns true for non-cloudBackup features on free tier", () => {
    expect(canUseFeature("free", "unlimitedPlans")).toBe(true);
    expect(canUseFeature("free", "exportData")).toBe(true);
    expect(canUseFeature("free", "monthlyAnalytics")).toBe(true);
    expect(canUseFeature("free", "advancedWorkoutPeriodization")).toBe(true);
  });

  it("returns false for cloudBackup with null tier", () => {
    expect(canUseFeature(null, "cloudBackup")).toBe(false);
  });
});

describe("planTiers", () => {
  it("contains all three tiers", () => {
    expect(planTiers).toEqual(["free", "premium", "annual"]);
  });
});

describe("premiumFeatures", () => {
  it("has all expected feature keys", () => {
    expect(premiumFeatures.unlimitedPlans).toBe("unlimited-plans");
    expect(premiumFeatures.exportData).toBe("export-data");
    expect(premiumFeatures.cloudBackup).toBe("cloud-backup");
    expect(premiumFeatures.monthlyAnalytics).toBe("monthly-analytics");
    expect(premiumFeatures.advancedWorkoutPeriodization).toBe("advanced-workout-periodization");
  });
});

describe("freeFeatureLimits", () => {
  it("has expected limit values", () => {
    expect(freeFeatureLimits.savedPlanHistory).toBe(1);
    expect(freeFeatureLimits.dashboardEntriesPreview).toBe(5);
    expect(freeFeatureLimits.progressChartDays).toBe(30);
  });
});
