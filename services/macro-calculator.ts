import type { MacroInput, MacroRecommendation, MacroTargets, MacroRange } from "@/types";

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
} as const;

const GOAL_RATES: Record<string, { label: string; multiplier: number; calorieAdjustment: number }> = {
  cut: { label: "Cut", multiplier: 0.85, calorieAdjustment: -350 },
  maintain: { label: "Maintain", multiplier: 1.0, calorieAdjustment: 0 },
  bulk: { label: "Bulk", multiplier: 1.10, calorieAdjustment: 250 }
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary (desk job, little exercise)",
  light: "Light activity (1-3 days/week)",
  moderate: "Moderate activity (3-5 days/week)",
  active: "Active (6-7 days/week)"
};

const CALORIE_FLOOR = {
  cut: 1200,
  maintain: 1500,
  bulk: 1800
} as const;

const PROTEIN_MIN_PER_KG = 1.6;
const PROTEIN_MAX_PER_KG = 2.4;
const FAT_MIN_PERCENT = 0.20;
const FAT_MAX_PERCENT = 0.35;

export function calculateMacroRecommendation(input: MacroInput): MacroRecommendation {
  const { weightKg, goal, activityLevel } = input;

  if (weightKg <= 0) {
    throw new Error("weightKg must be greater than 0.");
  }

  const hasBodyFat = input.bodyFatPercent !== undefined && input.bodyFatPercent > 0 && input.bodyFatPercent < 100;
  const method = hasBodyFat ? "katch-mcardle" as const : "mifflin-st-jeor" as const;

  const assumptions: string[] = [];
  const warnings: string[] = [];

  assumptions.push(`Activity: ${ACTIVITY_LABELS[activityLevel]}`);
  assumptions.push(`Multiplier: ×${ACTIVITY_MULTIPLIERS[activityLevel]}`);

  let leanBodyMassKg: number | null = null;
  let bmrCalories: number;
  let confidence: "high" | "medium" | "low" = "medium";

  if (method === "katch-mcardle") {
    const bfPercent = input.bodyFatPercent!;
    leanBodyMassKg = weightKg * (1 - bfPercent / 100);
    bmrCalories = 370 + 21.6 * leanBodyMassKg;
    assumptions.push(`Formula: Katch-McArdle (LBM = ${Math.round(leanBodyMassKg * 10) / 10} kg from ${bfPercent}% BF)`);
    confidence = "high";
  } else {
    bmrCalories = mifflinStJeor(weightKg);
    assumptions.push("Formula: Mifflin-St Jeor (body fat not provided)");
    warnings.push("For more accurate results, measure your body fat percentage.");
    confidence = "medium";
  }

  assumptions.push(`Goal: ${GOAL_RATES[goal].label} (×${GOAL_RATES[goal].multiplier}, ±${GOAL_RATES[goal].calorieAdjustment} kcal)`);

  const activityCalories = Math.round(bmrCalories * ACTIVITY_MULTIPLIERS[activityLevel]);
  const goalCalories = Math.round(activityCalories * GOAL_RATES[goal].multiplier);
  const floor = CALORIE_FLOOR[goal];
  const targetCalories = Math.max(goalCalories, floor);

  if (goalCalories < floor) {
    warnings.push(`Target adjusted to minimum ${floor} kcal/day (calculated ${goalCalories} was below safety floor).`);
  }

  const minCalories = Math.max(targetCalories - 150, floor);
  const maxCalories = targetCalories + 150;

  const effectiveWeight = leanBodyMassKg ?? weightKg;
  const proteinRecommended = Math.round(effectiveWeight * 2.0);
  const proteinMin = Math.round(effectiveWeight * PROTEIN_MIN_PER_KG);
  const proteinMax = Math.round(effectiveWeight * PROTEIN_MAX_PER_KG);

  const fatRecommended = Math.round((targetCalories * 0.25) / 9);
  const fatMin = Math.round((targetCalories * FAT_MIN_PERCENT) / 9);
  const fatMax = Math.round((targetCalories * FAT_MAX_PERCENT) / 9);

  const remainingCalories = targetCalories - proteinRecommended * 4 - fatRecommended * 9;
  const carbsRecommended = Math.max(Math.round(remainingCalories / 4), 0);

  const carbsMin = Math.max(Math.round((minCalories - proteinMax * 4 - fatMax * 9) / 4), 0);
  const carbsMax = Math.round((maxCalories - proteinMin * 4 - fatMin * 9) / 4);

  const targets: MacroTargets = {
    leanBodyMassKg: leanBodyMassKg ? Math.round(leanBodyMassKg * 10) / 10 : 0,
    bmrCalories: Math.round(bmrCalories),
    targetCalories,
    calories: targetCalories,
    proteinGrams: proteinRecommended,
    carbsGrams: carbsRecommended,
    fatGrams: fatRecommended
  };

  return {
    method,
    assumptions,
    warnings,
    confidence,
    targetCalories: { min: minCalories, max: maxCalories, recommended: targetCalories },
    proteinGrams: { min: proteinMin, max: proteinMax, recommended: proteinRecommended },
    fatGrams: { min: fatMin, max: fatMax, recommended: fatRecommended },
    carbsGrams: { min: carbsMin, max: carbsMax, recommended: carbsRecommended },
    leanBodyMassKg,
    bmrCalories: Math.round(bmrCalories),
    proteinGramsPerKg: effectiveWeight > 0 ? Math.round(proteinRecommended / effectiveWeight * 10) / 10 : 0,
    fatPercentOfCalories: targetCalories > 0 ? Math.round((fatRecommended * 9) / targetCalories * 100) : 25,
    targets
  };
}

function mifflinStJeor(weightKg: number): number {
  return 10 * weightKg + 6.25 * 170 - 5 * 25 + 5;
}

/** @deprecated Use calculateMacroRecommendation instead */
export function calculateMacroTargets(input: MacroInput): MacroTargets {
  const rec = calculateMacroRecommendation(input);
  return rec.targets;
}
