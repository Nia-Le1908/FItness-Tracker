import type { MealFood, Goal } from "@/types";

export const goals: Array<{ value: Goal; label: string; calorieAdjustment: number }> = [
  { value: "cut", label: "Cut fat", calorieAdjustment: -350 },
  { value: "maintain", label: "Maintain", calorieAdjustment: 0 },
  { value: "bulk", label: "Lean bulk", calorieAdjustment: 250 }
];

export const vietnameseFoods: MealFood[] = [
  { id: "rice", name: "Cơm trắng", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28.2, fatPer100g: 0.3, costPer100gVnd: 2500 },
  { id: "chicken", name: "Ức gà", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, costPer100gVnd: 12000 },
  { id: "egg", name: "Trứng gà", caloriesPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 1.1, fatPer100g: 9.5, costPer100gVnd: 8000 },
  { id: "tofu", name: "Đậu hũ", caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, costPer100gVnd: 5000 },
  { id: "banana", name: "Chuối", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 22.8, fatPer100g: 0.3, costPer100gVnd: 3500 }
];