import fs from 'fs';
import path from 'path';

const __dirname = path.resolve();

const macroTest = `import { calculateMacroTargets } from '@/services/macro-calculator';
import type { MacroInput } from '@/types';

describe('calculateMacroTargets', () => {
  const baseInput: MacroInput = {
    weightKg: 80,
    bodyFatPercent: 15,
    activityLevel: 'moderate',
    goal: 'maintain',
  };

  it('returns correct macronutrient targets for a standard input', () => {
    const result = calculateMacroTargets(baseInput);
    expect(result.leanBodyMassKg).toBe(68);
    expect(result.bmrCalories).toBe(1839);
    expect(result.targetCalories).toBe(2850);
    expect(result.proteinGrams).toBe(136);
    expect(result.fatGrams).toBe(79);
    expect(result.carbsGrams).toBe(399);
  });

  it.each([
    ['cut', 0.85, 2423],
    ['maintain', 1.0, 2850],
    ['bulk', 1.1, 3135],
  ])('applies correct goal multiplier for %s', (goal, _, expected) => {
    const result = calculateMacroTargets({ ...baseInput, goal: goal as MacroInput['goal'] });
    expect(result.targetCalories).toBe(expected);
  });

  it.each([
    ['sedentary', 1.2],
    ['light', 1.375],
    ['moderate', 1.55],
    ['active', 1.725],
  ])('applies correct activity factor for %s', (activity, factor) => {
    const result = calculateMacroTargets({ ...baseInput, activityLevel: activity as MacroInput['activityLevel'] });
    const bmr = 370 + 21.6 * (80 * (1 - 15 / 100));
    expect(result.targetCalories).toBe(Math.round(bmr * factor));
  });

  it('throws error if weightKg is 0', () => {
    expect(() => calculateMacroTargets({ ...baseInput, weightKg: 0 })).toThrow('weightKg must be greater than 0.');
  });

  it('throws error if bodyFatPercent >= 100', () => {
    expect(() => calculateMacroTargets({ ...baseInput, bodyFatPercent: 100 })).toThrow('bodyFatPercent must be between 0 and 100.');
  });

  it('handles bodyFatPercent = 0', () => {
    const result = calculateMacroTargets({ ...baseInput, bodyFatPercent: 0 });
    expect(result.leanBodyMassKg).toBe(80);
  });

  it('always returns positive values', () => {
    const result = calculateMacroTargets(baseInput);
    expect(result.calories).toBeGreaterThan(0);
    expect(result.proteinGrams).toBeGreaterThan(0);
    expect(result.carbsGrams).toBeGreaterThan(0);
    expect(result.fatGrams).toBeGreaterThan(0);
  });
});
`;

const validationTest = `import { isRecord, parseJsonBody, requireNumber, requireString, requireOneOf } from '@/lib/api/validation';

describe('isRecord', () => {
  it.each([
    { value: {}, expected: true },
    { value: { a: 1 }, expected: true },
    { value: null, expected: false },
    { value: undefined, expected: false },
    { value: 'string', expected: false },
    { value: 42, expected: false },
    { value: true, expected: false },
    { value: [1, 2], expected: false },
  ])('returns $expected for \`$value\`', ({ value, expected }) => {
    expect(isRecord(value)).toBe(expected);
  });
});

describe('parseJsonBody', () => {
  it('returns the body if it is a record', () => {
    expect(parseJsonBody({ name: 'test' })).toEqual({ name: 'test' });
  });

  it.each([null, 'string', 42, [1, 2], undefined])('throws if body is not a record', (value) => {
    expect(() => parseJsonBody(value)).toThrow('Request body must be a JSON object.');
  });
});

describe('requireNumber', () => {
  it('returns the number as-is', () => expect(requireNumber(25, 'age')).toBe(25));
  it('parses a numeric string', () => expect(requireNumber('25', 'age')).toBe(25));
  it('parses a decimal string', () => expect(requireNumber('12.5', 'weight')).toBe(12.5));
  it.each([null, undefined, 'abc', '', NaN, Infinity])('throws for non-finite value %p', (value) => {
    expect(() => requireNumber(value, 'field')).toThrow('field must be a valid number.');
  });
});

describe('requireString', () => {
  it('returns the string trimmed', () => expect(requireString('  hello  ', 'name')).toBe('hello'));
  it('returns a normal string as-is', () => expect(requireString('workout', 'type')).toBe('workout'));
  it.each([null, undefined, 42, true, '', '   '])('throws for non-string or empty value %p', (value) => {
    expect(() => requireString(value, 'field')).toThrow('field must be a non-empty string.');
  });
});

describe('requireOneOf', () => {
  const options = ['cut', 'maintain', 'bulk'] as const;
  it('returns the value if it is in options', () => {
    expect(requireOneOf('cut', 'goal', options)).toBe('cut');
    expect(requireOneOf('bulk', 'goal', options)).toBe('bulk');
  });
  it('throws if value is not in options', () => {
    expect(() => requireOneOf('invalid', 'goal', options)).toThrow('goal must be one of: cut, maintain, bulk.');
  });
});
`;

const mealPlannerTest = `import { buildBudgetMealPlan } from '@/services/meal-planner';
import type { MealFood, MealPlanRequest } from '@/types';

describe('buildBudgetMealPlan', () => {
  const sampleFoods: MealFood[] = [
    { id: '1', name: 'Chicken Breast', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, costPer100gVnd: 5000 },
    { id: '2', name: 'Rice', caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, costPer100gVnd: 2000 },
    { id: '3', name: 'Egg', caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, costPer100gVnd: 3000 },
  ];

  const baseRequest: MealPlanRequest = {
    budgetVnd: 100000,
    targetMacros: { calories: 2400, proteinGrams: 150, carbsGrams: 300, fatGrams: 70 },
    foods: sampleFoods,
  };

  it('returns a meal plan with the correct number of meals (4 for 100k/2400cal)', () => {
    const result = buildBudgetMealPlan(baseRequest);
    expect(result.meals.length).toBe(4);
  });

  it('returns empty plan when no foods have cost > 0', () => {
    const zeroCostFoods: MealFood[] = [
      { id: 'x', name: 'Water', caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, costPer100gVnd: 0 },
    ];
    const result = buildBudgetMealPlan({ ...baseRequest, foods: zeroCostFoods });
    expect(result.meals).toHaveLength(0);
    expect(result.totalCalories).toBe(0);
    expect(result.withinBudget).toBe(true);
    expect(result.withinMacroTargets).toBe(false);
  });

  it('returns 3 meals when budget < 80000', () => {
    const result = buildBudgetMealPlan({ ...baseRequest, budgetVnd: 50000 });
    expect(result.meals.length).toBe(3);
  });

  it('returns 5 meals when budget >= 160000 and calories >= 2600', () => {
    const result = buildBudgetMealPlan({ ...baseRequest, budgetVnd: 200000, targetMacros: { calories: 3000, proteinGrams: 180, carbsGrams: 400, fatGrams: 80 } });
    expect(result.meals.length).toBe(5);
  });

  it('each meal has entries with required fields', () => {
    const result = buildBudgetMealPlan(baseRequest);
    for (const meal of result.meals) {
      expect(meal.entries.length).toBeGreaterThan(0);
      for (const entry of meal.entries) {
        expect(entry).toHaveProperty('foodId');
        expect(entry).toHaveProperty('foodName');
        expect(entry).toHaveProperty('grams');
        expect(entry).toHaveProperty('calories');
        expect(entry).toHaveProperty('costVnd');
        expect(entry.grams).toBeGreaterThan(0);
      }
    }
  });

  it('total cost does not exceed budget', () => {
    const result = buildBudgetMealPlan(baseRequest);
    expect(result.totalCostVnd).toBeLessThanOrEqual(baseRequest.budgetVnd);
    expect(result.withinBudget).toBe(true);
  });

  it('totals match sum of meals', () => {
    const result = buildBudgetMealPlan(baseRequest);
    const sumCal = result.meals.reduce((s, m) => s + m.calories, 0);
    const sumCost = result.meals.reduce((s, m) => s + m.costVnd, 0);
    expect(result.totalCalories).toBeCloseTo(sumCal, 0);
    expect(result.totalCostVnd).toBeCloseTo(sumCost, 0);
  });

  it('handles single food item', () => {
    const result = buildBudgetMealPlan({ ...baseRequest, foods: [sampleFoods[0]] });
    expect(result.meals.length).toBeGreaterThan(0);
    for (const meal of result.meals) {
      for (const entry of meal.entries) {
        expect(entry.foodId).toBe('1');
      }
    }
  });
});
`;

// Write files
fs.writeFileSync(path.join(__dirname, '__tests__/services/macro-calculator.test.ts'), macroTest, 'utf8');
fs.writeFileSync(path.join(__dirname, '__tests__/lib/validation.test.ts'), validationTest, 'utf8');
fs.writeFileSync(path.join(__dirname, '__tests__/services/meal-planner.test.ts'), mealPlannerTest, 'utf8');

console.log('All test files created successfully.');
