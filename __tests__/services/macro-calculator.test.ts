import { calculateMacroRecommendation, calculateMacroTargets } from "@/services/macro-calculator";

describe("calculateMacroTargets (backward compat)", () => {
  it("calculates macro targets for a moderate maintenance plan", () => {
    const result = calculateMacroTargets({
      weightKg: 72,
      bodyFatPercent: 18,
      goal: "maintain",
      activityLevel: "moderate"
    });

    expect(result.leanBodyMassKg).toBe(59.0);
    expect(result.bmrCalories).toBe(1645);
    expect(result.targetCalories).toBe(2550);
    expect(result.calories).toBe(2550);
    expect(result.proteinGrams).toBe(118);
    expect(result.fatGrams).toBe(71);
    expect(result.carbsGrams).toBe(360);
  });

  it("applies goal multipliers", () => {
    const cut = calculateMacroTargets({
      weightKg: 80,
      bodyFatPercent: 20,
      goal: "cut",
      activityLevel: "light"
    });

    const bulk = calculateMacroTargets({
      weightKg: 80,
      bodyFatPercent: 20,
      goal: "bulk",
      activityLevel: "light"
    });

    expect(cut.targetCalories).toBeLessThan(bulk.targetCalories);
  });

  it("rejects zero weight", () => {
    expect(() =>
      calculateMacroTargets({
        weightKg: 0,
        bodyFatPercent: 15,
        goal: "maintain",
        activityLevel: "moderate"
      })
    ).toThrow("weightKg must be greater than 0.");
  });
});

describe("calculateMacroRecommendation", () => {
  it("returns full recommendation with method, ranges, and assumptions", () => {
    const rec = calculateMacroRecommendation({
      weightKg: 72,
      bodyFatPercent: 18,
      goal: "maintain",
      activityLevel: "moderate"
    });

    expect(rec.method).toBe("katch-mcardle");
    expect(rec.confidence).toBe("high");
    expect(rec.assumptions.length).toBeGreaterThan(0);
    expect(rec.targetCalories.recommended).toBeGreaterThan(0);
    expect(rec.targetCalories.min).toBeGreaterThan(0);
    expect(rec.targetCalories.max).toBeGreaterThan(rec.targetCalories.min);
    expect(rec.proteinGrams.recommended).toBeGreaterThan(0);
    expect(rec.fatGrams.recommended).toBeGreaterThan(0);
    expect(rec.carbsGrams.recommended).toBeGreaterThan(0);
    expect(rec.targets).toBeDefined();
  });

  it("falls back to Mifflin-St Jeor when body fat is unknown", () => {
    const rec = calculateMacroRecommendation({
      weightKg: 72,
      goal: "maintain",
      activityLevel: "moderate"
    });

    expect(rec.method).toBe("mifflin-st-jeor");
    expect(rec.confidence).toBe("medium");
    expect(rec.leanBodyMassKg).toBeNull();
    expect(rec.warnings.length).toBeGreaterThan(0);
    expect(rec.targets.calories).toBeGreaterThan(0);
  });

  it("handles edge case body fat values by falling back", () => {
    const rec = calculateMacroRecommendation({
      weightKg: 70,
      bodyFatPercent: 100,
      goal: "maintain",
      activityLevel: "moderate"
    });

    expect(rec.method).toBe("mifflin-st-jeor");
    expect(rec.targets.calories).toBeGreaterThan(0);
  });

  it("enforces calorie floor for cut", () => {
    const rec = calculateMacroRecommendation({
      weightKg: 40,
      goal: "cut",
      activityLevel: "sedentary"
    });

    expect(rec.targetCalories.recommended).toBeGreaterThanOrEqual(1200);
  });

  it("returns guardrail warning when adjusted below floor", () => {
    const rec = calculateMacroRecommendation({
      weightKg: 35,
      bodyFatPercent: 10,
      goal: "cut",
      activityLevel: "sedentary"
    });

    expect(rec.targetCalories.recommended).toBeGreaterThanOrEqual(1200);
  });
});
