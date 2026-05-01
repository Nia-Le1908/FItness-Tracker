import type { MacroInput, MacroTargets } from "@/types";

const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
} as const;

const goalMultipliers = {
  cut: 0.85,
  maintain: 1,
  bulk: 1.1
} as const;

export function calculateMacroTargets(input: MacroInput): MacroTargets {
  if (input.weightKg <= 0) {
    throw new Error("weightKg must be greater than 0.");
  }

  if (input.bodyFatPercent < 0 || input.bodyFatPercent >= 100) {
    throw new Error("bodyFatPercent must be between 0 and 100.");
  }

  const leanBodyMassKg = input.weightKg * (1 - input.bodyFatPercent / 100);
  const bmrCalories = 370 + 21.6 * leanBodyMassKg;
  const targetCalories = Math.round(bmrCalories * activityFactors[input.activityLevel] * goalMultipliers[input.goal]);
  const proteinGrams = Math.round(leanBodyMassKg * 2);
  const fatGrams = Math.round((targetCalories * 0.25) / 9);
  const remainingCalories = Math.max(targetCalories - proteinGrams * 4 - fatGrams * 9, 0);
  const carbsGrams = Math.round(remainingCalories / 4);

  return {
    leanBodyMassKg: Math.round(leanBodyMassKg * 10) / 10,
    bmrCalories: Math.round(bmrCalories),
    targetCalories,
    calories: targetCalories,
    proteinGrams,
    carbsGrams,
    fatGrams
  };
}