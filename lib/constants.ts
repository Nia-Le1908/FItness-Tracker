import type { MealFood, Goal } from "@/types";

export const goals: Array<{ value: Goal; label: string; calorieAdjustment: number }> = [
  { value: "cut", label: "Cut fat", calorieAdjustment: -350 },
  { value: "maintain", label: "Maintain", calorieAdjustment: 0 },
  { value: "bulk", label: "Lean bulk", calorieAdjustment: 250 }
];

export const workoutPlannerDefaults = {
  daysPerWeek: "4",
  equipment: "dumbbells"
} as const;

export const macroPlannerDefaults = {
  customCalories: 2000,
  customProteinGrams: 150,
  customCarbsGrams: 200,
  customFatGrams: 60
} as const;

export const mealPlannerLimits = {
  lowBudgetVnd: 80000,
  midBudgetVnd: 160000,
  lowCalories: 1800,
  midCalories: 2600,
  minPortionGrams: 40,
  targetTolerance: 0.9,
  targetToleranceUpper: 1.1,
  roundedMealHistoryCount: 20
} as const;

export const progressDefaults = {
  initialWeightEntryDateFormat: "YYYY-MM-DD"
} as const;

export const apiDefaults = {
  internalErrorStatus: 500,
  badRequestStatus: 400,
  unauthorizedStatus: 401,
  forbiddenStatus: 403,
  createdStatus: 201
} as const;

export const vietnameseFoods: MealFood[] = [
  // === PROTEIN SOURCES ===
  {
    id: "chicken", name: "Ức gà", nameVi: "Ức gà", aliases: ["chicken breast", "ga", "white meat"],
    caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6,
    costPer100gVnd: 12000, category: "protein", tags: ["high-protein", "low-fat", "gluten-free"],
    servings: [{ label: "1 ức (150g)", grams: 150 }, { label: "1 lạng (100g)", grams: 100 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "pork", name: "Thịt lợn nạc", nameVi: "Thịt lợn nạc", aliases: ["pork lean", "thit heo", "lon"],
    caloriesPer100g: 143, proteinPer100g: 21, carbsPer100g: 0, fatPer100g: 6.3,
    costPer100gVnd: 8000, category: "protein", tags: ["high-protein", "gluten-free"],
    servings: [{ label: "1 lạng (100g)", grams: 100 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "beef", name: "Thịt bò", nameVi: "Thịt bò", aliases: ["beef", "bo", "thit bo"],
    caloriesPer100g: 250, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15,
    costPer100gVnd: 18000, category: "protein", tags: ["high-protein", "gluten-free"],
    servings: [{ label: "1 lạng (100g)", grams: 100 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "egg", name: "Trứng gà", nameVi: "Trứng gà", aliases: ["egg", "trung", "chicken egg"],
    caloriesPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 1.1, fatPer100g: 9.5,
    costPer100gVnd: 8000, category: "protein", tags: ["high-protein", "vegetarian", "gluten-free"],
    servings: [{ label: "1 quả (55g)", grams: 55 }, { label: "2 quả (110g)", grams: 110 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "tofu", name: "Đậu hũ", nameVi: "Đậu hũ", aliases: ["tofu", "dau phu", "dau hu"],
    caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8,
    costPer100gVnd: 5000, category: "protein", tags: ["vegetarian", "gluten-free", "low-fat"],
    servings: [{ label: "1 miếng (100g)", grams: 100 }, { label: "2 miếng (200g)", grams: 200 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "shrimp", name: "Tôm", nameVi: "Tôm", aliases: ["shrimp", "tom", "prawn"],
    caloriesPer100g: 99, proteinPer100g: 24, carbsPer100g: 0.2, fatPer100g: 0.3,
    costPer100gVnd: 25000, category: "protein", tags: ["high-protein", "low-fat", "gluten-free"],
    servings: [{ label: "1 lạng (100g)", grams: 100 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "fish", name: "Cá basa", nameVi: "Cá basa", aliases: ["fish", "ca", "basa", "catfish"],
    caloriesPer100g: 126, proteinPer100g: 15.6, carbsPer100g: 0, fatPer100g: 6.6,
    costPer100gVnd: 9000, category: "protein", tags: ["high-protein", "gluten-free"],
    servings: [{ label: "1 khứa (150g)", grams: 150 }, { label: "1 lạng (100g)", grams: 100 }],
    source: "USDA SR28", confidence: "verified"
  },

  // === STARCH / CARBS ===
  {
    id: "rice", name: "Cơm trắng", nameVi: "Cơm trắng", aliases: ["rice", "com", "com trang"],
    caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28.2, fatPer100g: 0.3,
    costPer100gVnd: 2500, category: "starch", tags: ["vegetarian", "gluten-free", "low-fat"],
    servings: [{ label: "1 chén (150g)", grams: 150 }, { label: "1 bát (200g)", grams: 200 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "sweet-potato", name: "Khoai lang", nameVi: "Khoai lang", aliases: ["sweet potato", "khoai"],
    caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20.1, fatPer100g: 0.1, fiberPer100g: 3.0,
    costPer100gVnd: 4000, category: "starch", tags: ["vegetarian", "gluten-free", "high-fiber", "low-fat"],
    servings: [{ label: "1 củ (200g)", grams: 200 }, { label: "1 củ nhỏ (150g)", grams: 150 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "bread", name: "Bánh mì", nameVi: "Bánh mì", aliases: ["bread", "banh mi", "banh my"],
    caloriesPer100g: 265, proteinPer100g: 9.2, carbsPer100g: 49, fatPer100g: 3.2,
    costPer100gVnd: 3500, category: "starch", tags: ["vegetarian"],
    servings: [{ label: "1 ổ (80g)", grams: 80 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "noodles", name: "Bún tươi", nameVi: "Bún tươi", aliases: ["noodles", "bun", "rice vermicelli"],
    caloriesPer100g: 110, proteinPer100g: 1.8, carbsPer100g: 25.2, fatPer100g: 0.3,
    costPer100gVnd: 3000, category: "starch", tags: ["vegetarian", "low-fat", "gluten-free"],
    servings: [{ label: "1 tô (200g)", grams: 200 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "oats", name: "Yến mạch", nameVi: "Yến mạch", aliases: ["oats", "yen mach", "oatmeal"],
    caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9, fiberPer100g: 10.6,
    costPer100gVnd: 6000, category: "starch", tags: ["vegetarian", "high-fiber"],
    servings: [{ label: "1 phần (40g)", grams: 40 }, { label: "1 chén (80g)", grams: 80 }],
    source: "USDA SR28", confidence: "verified"
  },

  // === VEGETABLES ===
  {
    id: "morning-glory", name: "Rau muống", nameVi: "Rau muống", aliases: ["morning glory", "rau muong", "water spinach"],
    caloriesPer100g: 19, proteinPer100g: 2.6, carbsPer100g: 3.1, fatPer100g: 0.2, fiberPer100g: 2.1,
    costPer100gVnd: 3000, category: "vegetable", tags: ["vegetarian", "gluten-free", "low-fat", "high-fiber"],
    servings: [{ label: "1 đĩa (200g)", grams: 200 }, { label: "1 bó (300g)", grams: 300 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "bok-choy", name: "Cải thìa", nameVi: "Cải thìa", aliases: ["bok choy", "cai thia", "cai thi"],
    caloriesPer100g: 13, proteinPer100g: 1.5, carbsPer100g: 2.2, fatPer100g: 0.2, fiberPer100g: 1.0,
    costPer100gVnd: 4000, category: "vegetable", tags: ["vegetarian", "gluten-free", "low-fat"],
    servings: [{ label: "1 cây (100g)", grams: 100 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "carrot", name: "Cà rốt", nameVi: "Cà rốt", aliases: ["carrot", "ca rot"],
    caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 9.6, fatPer100g: 0.2, fiberPer100g: 2.8,
    costPer100gVnd: 3500, category: "vegetable", tags: ["vegetarian", "gluten-free", "low-fat"],
    servings: [{ label: "1 củ (80g)", grams: 80 }],
    source: "USDA SR28", confidence: "verified"
  },

  // === FRUITS ===
  {
    id: "banana", name: "Chuối", nameVi: "Chuối", aliases: ["banana", "chuoi"],
    caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 22.8, fatPer100g: 0.3, fiberPer100g: 2.6,
    costPer100gVnd: 3500, category: "fruit", tags: ["vegetarian", "gluten-free", "low-fat"],
    servings: [{ label: "1 quả (120g)", grams: 120 }, { label: "1 quả nhỏ (80g)", grams: 80 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "papaya", name: "Đu đủ", nameVi: "Đu đủ", aliases: ["papaya", "du du"],
    caloriesPer100g: 43, proteinPer100g: 0.5, carbsPer100g: 10.8, fatPer100g: 0.3, fiberPer100g: 1.7,
    costPer100gVnd: 3000, category: "fruit", tags: ["vegetarian", "gluten-free", "low-fat"],
    servings: [{ label: "1 miếng (200g)", grams: 200 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "dragon-fruit", name: "Thanh long", nameVi: "Thanh long", aliases: ["dragon fruit", "thanh long"],
    caloriesPer100g: 60, proteinPer100g: 1.2, carbsPer100g: 13, fatPer100g: 0.4, fiberPer100g: 1.8,
    costPer100gVnd: 4000, category: "fruit", tags: ["vegetarian", "gluten-free", "low-fat"],
    servings: [{ label: "1 quả (300g)", grams: 300 }],
    source: "USDA SR28", confidence: "verified"
  },

  // === FATS & OTHERS ===
  {
    id: "peanut", name: "Đậu phộng", nameVi: "Đậu phộng", aliases: ["peanut", "dau phong", "lac"],
    caloriesPer100g: 567, proteinPer100g: 25.8, carbsPer100g: 16.1, fatPer100g: 49.2, fiberPer100g: 8.5,
    costPer100gVnd: 7000, category: "fat", tags: ["vegetarian", "gluten-free", "high-protein"],
    servings: [{ label: "1 nắm (30g)", grams: 30 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "milk", name: "Sữa tươi", nameVi: "Sữa tươi", aliases: ["milk", "sua", "sua tuoi", "fresh milk"],
    caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3,
    costPer100gVnd: 3500, category: "dairy", tags: ["vegetarian", "high-protein"],
    servings: [{ label: "1 hộp (180ml)", grams: 180 }, { label: "1 ly (250ml)", grams: 250 }],
    source: "USDA SR28", confidence: "verified"
  },
  {
    id: "yogurt", name: "Sữa chua", nameVi: "Sữa chua", aliases: ["yogurt", "sua chua", "yaourt"],
    caloriesPer100g: 63, proteinPer100g: 5.3, carbsPer100g: 7, fatPer100g: 1.6,
    costPer100gVnd: 5000, category: "dairy", tags: ["vegetarian", "high-protein", "low-fat"],
    servings: [{ label: "1 hộp (100g)", grams: 100 }],
    source: "USDA SR28", confidence: "verified"
  }
];

/** Quick lookup map by food id */
const foodById = new Map(vietnameseFoods.map((f) => [f.id, f] as const));

export function findFoodById(id: string): MealFood | undefined {
  return foodById.get(id);
}

export function searchFoods(query: string): MealFood[] {
  const q = query.toLowerCase().trim();
  if (!q) { return [...vietnameseFoods]; }

  return vietnameseFoods.filter((f) =>
    f.name.toLowerCase().includes(q) ||
    (f.nameVi && f.nameVi.toLowerCase().includes(q)) ||
    f.aliases?.some((a) => a.toLowerCase().includes(q)) ||
    (f.category && f.category.includes(q))
  );
}

export function getFoodsByCategory(category: MealFood["category"]): MealFood[] {
  return vietnameseFoods.filter((f) => f.category === category);
}
