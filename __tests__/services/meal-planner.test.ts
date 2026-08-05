import { buildBudgetMealPlan } from "@/services/meal-planner";

describe("buildBudgetMealPlan", () => {
  const foods = [
    {
      id: "chicken",
      name: "Chicken breast",
      caloriesPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatPer100g: 3.6,
      costPer100gVnd: 25000
    },
    {
      id: "rice",
      name: "Rice",
      caloriesPer100g: 130,
      proteinPer100g: 2.4,
      carbsPer100g: 28,
      fatPer100g: 0.3,
      costPer100gVnd: 6000
    },
    {
      id: "peanut",
      name: "Peanut",
      caloriesPer100g: 567,
      proteinPer100g: 26,
      carbsPer100g: 16,
      fatPer100g: 49,
      costPer100gVnd: 12000
    }
  ];

  it("returns an empty plan when there are no valid foods", () => {
    const result = buildBudgetMealPlan({
      budgetVnd: 100000,
      targetMacros: {
        calories: 2000,
        proteinGrams: 150,
        carbsGrams: 200,
        fatGrams: 60
      },
      foods: []
    });

    expect(result).toEqual({
      meals: [],
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalCostVnd: 0,
      withinBudget: true,
      withinMacroTargets: false
    });
  });

  it("uses three meals for low budget plans", () => {
    const result = buildBudgetMealPlan({
      budgetVnd: 70000,
      targetMacros: {
        calories: 1700,
        proteinGrams: 120,
        carbsGrams: 180,
        fatGrams: 50
      },
      foods
    });

    expect(result.meals).toHaveLength(3);
  });

  it("builds a non-empty plan with totals and budget flag", () => {
    const result = buildBudgetMealPlan({
      budgetVnd: 200000,
      targetMacros: {
        calories: 2400,
        proteinGrams: 160,
        carbsGrams: 240,
        fatGrams: 70
      },
      foods
    });

    expect(result.meals.length).toBeGreaterThan(0);
    expect(result.totalCalories).toBeGreaterThan(0);
    expect(result.totalCostVnd).toBeGreaterThan(0);
    expect(typeof result.withinBudget).toBe("boolean");
    expect(typeof result.withinMacroTargets).toBe("boolean");
  });
});
