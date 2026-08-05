# Domain Knowledge — Nutrition & Meals

> Domain knowledge cho meal planning, macro tracking, nutrition trong FitBudget.

## Domain Concepts
- **Meal Plan**: kế hoạch ăn uống theo ngày/tuần, gồm nhiều meals
- **Meal**: 1 bữa ăn (breakfast/lunch/dinner/snack), gồm nhiều food items
- **Food Item**: thực phẩm cụ thể với calories, protein/carbs/fat
- **Macro Plan**: mục tiêu macro hàng ngày (calories, protein, carbs, fat)
- **Macro Split** = tỷ lệ % calories từ protein/carbs/fat (e.g., 40/30/30)
- **TDEE (Total Daily Energy Expenditure)**: calories tiêu hao mỗi ngày
- **Calorie Deficit/Surplus** = TDEE - actual intake

## Naming Conventions
- Tables: `meal_plans`, `meals`, `food_items`, `macro_plans`
- Services: `getMealPlan`, `logMeal`, `calculateMacros`
- API routes: `/api/meal-plans`, `/api/meal`, `/api/macro`
- Types: PascalCase (`MealPlan`, `FoodItem`, `MacroPlan`)

## Business Rules
1. Macro plan là 1-per-user (mỗi user chỉ có 1 active plan tại 1 thời điểm)
2. Meal plan templates có thể public (admin tạo) hoặc private (user tự tạo)
3. Nếu meal log thiếu macro → ước lượng 0 (cảnh báo user)
4. Weekly macro summary = tổng daily của 7 ngày gần nhất

## Validation Rules
- `calories`: number ≥ 0, max 10000
- `protein`/`carbs`/`fat`: number ≥ 0, max 1000 (grams)
- `meal_type`: enum `['breakfast', 'lunch', 'dinner', 'snack']`
- `servings`: number > 0
- `date`: ISO date string, không trong tương lai

## Calculation Standards
- 1g protein = 4 calories
- 1g carbs = 4 calories
- 1g fat = 9 calories
- TDEE = BMR × activity factor
- BMR (Mifflin-St Jeor):
  - Male: 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
  - Female: 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

## Integration Points
- Progress tracker: track calorie intake vs goal
- Notifications: nhắc log meal
- Admin: aggregated nutrition analytics
