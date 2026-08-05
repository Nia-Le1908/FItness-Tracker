-- FitBudget seed data (idempotent)
--
-- This file is designed to be safe to rerun:
-- 1) cleanup duplicates that may exist from earlier imports
-- 2) ensure unique constraints required for upserts
-- 3) upsert seed records for foods, macro_plan_templates, meal_plan_templates

create extension if not exists pgcrypto;

-- =========================================================
-- 1) Cleanup duplicates that block unique constraints
-- =========================================================

delete from public.foods f
using public.foods f2
where f.name = f2.name
  and f.ctid < f2.ctid;

delete from public.macro_plan_templates m
using public.macro_plan_templates m2
where m.template_key = m2.template_key
  and m.ctid < m2.ctid;

delete from public.meal_plan_templates m
using public.meal_plan_templates m2
where m.template_key = m2.template_key
  and m.ctid < m2.ctid;

-- =========================================================
-- 2) Add unique indexes for idempotent upserts
-- =========================================================

create unique index if not exists foods_name_key
  on public.foods (name);

create unique index if not exists macro_plan_templates_template_key_key
  on public.macro_plan_templates (template_key);

create unique index if not exists meal_plan_templates_template_key_key
  on public.meal_plan_templates (template_key);

-- =========================================================
-- 3) Seed foods
-- =========================================================

insert into public.foods (
  name,
  category,
  calories_per_100g,
  protein_per_100g,
  carbs_per_100g,
  fat_per_100g,
  cost_per_100g_vnd,
  serving_size_g,
  is_active
)
values
  -- Protein sources
  ('Ức gà', 'protein', 165, 31.00, 0.00, 3.60, 12000, 100, true),
  ('Thịt lợn nạc', 'protein', 143, 21.00, 0.00, 6.30, 8000, 100, true),
  ('Thịt bò', 'protein', 250, 26.00, 0.00, 15.00, 18000, 100, true),
  ('Trứng gà', 'protein', 143, 12.60, 1.10, 9.50, 8000, 100, true),
  ('Cá hồi', 'protein', 208, 20.40, 0.00, 13.40, 28000, 100, true),
  ('Cá basa', 'protein', 126, 15.60, 0.00, 6.60, 9000, 100, true),
  ('Tôm', 'protein', 99, 24.00, 0.20, 0.30, 25000, 100, true),
  ('Đậu hũ', 'protein', 76, 8.00, 1.90, 4.80, 5000, 100, true),
  -- Starch / carbs
  ('Cơm trắng', 'starch', 130, 2.70, 28.20, 0.30, 2500, 100, true),
  ('Khoai lang', 'starch', 86, 1.60, 20.10, 0.10, 4000, 100, true),
  ('Bánh mì', 'starch', 265, 9.20, 49.00, 3.20, 3500, 100, true),
  ('Bún tươi', 'starch', 110, 1.80, 25.20, 0.30, 3000, 100, true),
  ('Yến mạch', 'starch', 389, 16.90, 66.30, 6.90, 6000, 100, true),
  -- Vegetables
  ('Rau muống', 'vegetable', 19, 2.60, 3.10, 0.20, 3000, 100, true),
  ('Cải thìa', 'vegetable', 13, 1.50, 2.20, 0.20, 4000, 100, true),
  ('Cà rốt', 'vegetable', 41, 0.90, 9.60, 0.20, 3500, 100, true),
  -- Fruits
  ('Chuối', 'fruit', 89, 1.10, 22.80, 0.30, 3500, 100, true),
  ('Đu đủ', 'fruit', 43, 0.50, 10.80, 0.30, 3000, 100, true),
  ('Thanh long', 'fruit', 60, 1.20, 13.00, 0.40, 4000, 100, true),
  -- Fats & dairy
  ('Đậu phộng', 'fat', 567, 25.80, 16.10, 49.20, 7000, 100, true),
  ('Sữa tươi', 'dairy', 61, 3.20, 4.80, 3.30, 3500, 100, true),
  ('Sữa chua', 'dairy', 63, 5.30, 7.00, 1.60, 5000, 100, true)
on conflict (name) do update set
  category = excluded.category,
  calories_per_100g = excluded.calories_per_100g,
  protein_per_100g = excluded.protein_per_100g,
  carbs_per_100g = excluded.carbs_per_100g,
  fat_per_100g = excluded.fat_per_100g,
  cost_per_100g_vnd = excluded.cost_per_100g_vnd,
  serving_size_g = excluded.serving_size_g,
  is_active = excluded.is_active;

-- =========================================================
-- 4) Seed macro plan templates
-- =========================================================

insert into public.macro_plan_templates (
  template_key,
  name,
  description,
  goal,
  activity_level,
  tags,
  plan_json,
  is_active
)
values
  (
    'cut-beginner-60kg',
    'Beginner Fat Loss 60kg',
    'Simple high-protein target for a lighter trainee starting a fat-loss phase.',
    'cut',
    'light',
    array['cut', 'beginner', 'high-protein'],
    $json${"leanBodyMassKg":48,"bmrCalories":1407,"targetCalories":1700,"calories":1700,"proteinGrams":125,"carbsGrams":188,"fatGrams":50}$json$::jsonb,
    true
  ),
  (
    'cut-high-protein-75kg',
    'High Protein Cut 75kg',
    'A stronger deficit target with enough protein for lifting performance.',
    'cut',
    'moderate',
    array['cut', 'strength', 'high-protein'],
    $json${"leanBodyMassKg":61.5,"bmrCalories":1698,"targetCalories":2100,"calories":2100,"proteinGrams":170,"carbsGrams":220,"fatGrams":60}$json$::jsonb,
    true
  ),
  (
    'maintain-office-65kg',
    'Office Maintenance 65kg',
    'Balanced maintenance macros for mostly desk work plus regular training.',
    'maintain',
    'light',
    array['maintain', 'office', 'balanced'],
    $json${"leanBodyMassKg":52,"bmrCalories":1493,"targetCalories":2100,"calories":2100,"proteinGrams":130,"carbsGrams":260,"fatGrams":60}$json$::jsonb,
    true
  ),
  (
    'maintain-active-80kg',
    'Active Maintenance 80kg',
    'Higher-carb maintenance target for frequent training and active workdays.',
    'maintain',
    'active',
    array['maintain', 'active', 'performance'],
    $json${"leanBodyMassKg":67.2,"bmrCalories":1822,"targetCalories":2800,"calories":2800,"proteinGrams":170,"carbsGrams":360,"fatGrams":75}$json$::jsonb,
    true
  ),
  (
    'lean-bulk-70kg',
    'Lean Bulk 70kg',
    'Small surplus macro split for gaining muscle without aggressive fat gain.',
    'bulk',
    'moderate',
    array['bulk', 'lean-bulk', 'hypertrophy'],
    $json${"leanBodyMassKg":59.5,"bmrCalories":1655,"targetCalories":2700,"calories":2700,"proteinGrams":155,"carbsGrams":351,"fatGrams":75}$json$::jsonb,
    true
  ),
  (
    'hardgainer-bulk-85kg',
    'Hardgainer Bulk 85kg',
    'Large surplus template for trainees who struggle to gain body weight.',
    'bulk',
    'active',
    array['bulk', 'hardgainer', 'high-carb'],
    $json${"leanBodyMassKg":73.1,"bmrCalories":1949,"targetCalories":3300,"calories":3300,"proteinGrams":190,"carbsGrams":455,"fatGrams":80}$json$::jsonb,
    true
  ),
  (
    'recomposition-72kg',
    'Recomposition 72kg',
    'Near-maintenance target with elevated protein for body recomposition.',
    'maintain',
    'moderate',
    array['maintain', 'recomposition', 'high-protein'],
    $json${"leanBodyMassKg":57.6,"bmrCalories":1614,"targetCalories":2300,"calories":2300,"proteinGrams":160,"carbsGrams":258,"fatGrams":70}$json$::jsonb,
    true
  ),
  (
    'budget-cut-68kg',
    'Budget Cut 68kg',
    'Cost-conscious fat-loss target that still protects protein intake.',
    'cut',
    'moderate',
    array['cut', 'budget', 'meal-prep'],
    $json${"leanBodyMassKg":53,"bmrCalories":1515,"targetCalories":1850,"calories":1850,"proteinGrams":150,"carbsGrams":189,"fatGrams":55}$json$::jsonb,
    true
  ),
  (
    'endurance-maintenance-78kg',
    'Endurance Maintenance 78kg',
    'High-carb maintenance split for running, cycling, or sport days.',
    'maintain',
    'active',
    array['maintain', 'endurance', 'high-carb'],
    $json${"leanBodyMassKg":66.3,"bmrCalories":1802,"targetCalories":3000,"calories":3000,"proteinGrams":165,"carbsGrams":428,"fatGrams":70}$json$::jsonb,
    true
  ),
  (
    'rest-day-lower-carb-74kg',
    'Rest Day Lower Carb 74kg',
    'Lower-carb rest-day template with protein held high and fats slightly higher.',
    'maintain',
    'sedentary',
    array['maintain', 'rest-day', 'lower-carb'],
    $json${"leanBodyMassKg":60.7,"bmrCalories":1681,"targetCalories":2000,"calories":2000,"proteinGrams":160,"carbsGrams":171,"fatGrams":75}$json$::jsonb,
    true
  )
on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  activity_level = excluded.activity_level,
  tags = excluded.tags,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- =========================================================
-- 5) Seed meal plan templates
-- =========================================================

insert into public.meal_plan_templates (
  template_key,
  name,
  description,
  goal,
  tags,
  budget_vnd,
  plan_json,
  is_active
)
values
  (
    'meal-high-protein-cut',
    'High Protein Cut',
    'Four balanced meals built around chicken, eggs, rice, vegetables, and tofu.',
    'cut',
    array['cut', 'high-protein', 'balanced'],
    115000,
    $json${
      "budgetVnd":115000,
      "targetMacros":{"calories":1800,"proteinGrams":150,"carbsGrams":200,"fatGrams":50},
      "plan":{
        "meals":[
          {"name":"Breakfast","entries":[{"foodId":"oats","foodName":"Oats","grams":50,"calories":195,"costVnd":4500},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"banana","foodName":"Banana","grams":100,"calories":89,"costVnd":3500}],"calories":427,"proteinGrams":22.2,"carbsGrams":57,"fatGrams":13.3,"costVnd":16000},
          {"name":"Lunch","entries":[{"foodId":"chicken","foodName":"Chicken breast","grams":200,"calories":330,"costVnd":24000},{"foodId":"rice","foodName":"White rice","grams":220,"calories":286,"costVnd":5500},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":654,"proteinGrams":73.1,"carbsGrams":68.2,"fatGrams":8.3,"costVnd":35500},
          {"name":"Snack","entries":[{"foodId":"tofu","foodName":"Tofu","grams":200,"calories":152,"costVnd":10000},{"foodId":"banana","foodName":"Banana","grams":100,"calories":89,"costVnd":3500}],"calories":241,"proteinGrams":17.1,"carbsGrams":26.6,"fatGrams":9.9,"costVnd":13500},
          {"name":"Dinner","entries":[{"foodId":"chicken","foodName":"Chicken breast","grams":120,"calories":198,"costVnd":14400},{"foodId":"rice","foodName":"White rice","grams":180,"calories":234,"costVnd":4500},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000}],"calories":613,"proteinGrams":49.8,"carbsGrams":58.1,"fatGrams":14.6,"costVnd":32900}
        ],
        "totalCalories":1935,
        "totalProteinGrams":162.2,
        "totalCarbsGrams":209.9,
        "totalFatGrams":46.1,
        "totalCostVnd":97900,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  ),
  (
    'meal-lean-bulk-vietnamese-staples',
    'Lean Bulk Vietnamese Staples',
    'Five meals using rice, chicken, eggs, oats, banana, and salmon for a steady surplus.',
    'bulk',
    array['bulk', 'lean-bulk', 'vietnamese-staples'],
    170000,
    $json${
      "budgetVnd":170000,
      "targetMacros":{"calories":2800,"proteinGrams":180,"carbsGrams":360,"fatGrams":75},
      "plan":{
        "meals":[
          {"name":"Breakfast","entries":[{"foodId":"oats","foodName":"Oats","grams":80,"calories":311,"costVnd":7200},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"banana","foodName":"Banana","grams":120,"calories":107,"costVnd":4200}],"calories":561,"proteinGrams":27.4,"carbsGrams":81.2,"fatGrams":15.4,"costVnd":19400},
          {"name":"Lunch","entries":[{"foodId":"rice","foodName":"White rice","grams":300,"calories":390,"costVnd":7500},{"foodId":"chicken","foodName":"Chicken breast","grams":180,"calories":297,"costVnd":21600},{"foodId":"greens","foodName":"Morning glory","grams":150,"calories":29,"costVnd":4500}],"calories":716,"proteinGrams":69.9,"carbsGrams":89.3,"fatGrams":7.2,"costVnd":33600},
          {"name":"Snack","entries":[{"foodId":"tofu","foodName":"Tofu","grams":250,"calories":190,"costVnd":12500},{"foodId":"rice","foodName":"White rice","grams":180,"calories":234,"costVnd":4500},{"foodId":"banana","foodName":"Banana","grams":100,"calories":89,"costVnd":3500}],"calories":513,"proteinGrams":27.7,"carbsGrams":78.4,"fatGrams":12.8,"costVnd":20500},
          {"name":"Dinner","entries":[{"foodId":"salmon","foodName":"Salmon","grams":150,"calories":312,"costVnd":42000},{"foodId":"rice","foodName":"White rice","grams":260,"calories":338,"costVnd":6500},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":688,"proteinGrams":46.6,"carbsGrams":79.5,"fatGrams":21.5,"costVnd":54500},
          {"name":"Before bed","entries":[{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"oats","foodName":"Oats","grams":45,"calories":175,"costVnd":4050}],"calories":318,"proteinGrams":20.2,"carbsGrams":30.9,"fatGrams":12.6,"costVnd":12050}
        ],
        "totalCalories":2796,
        "totalProteinGrams":191.8,
        "totalCarbsGrams":359.3,
        "totalFatGrams":69.5,
        "totalCostVnd":140050,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  ),
  (
    'meal-vegetarian-maintain',
    'Vegetarian Maintain',
    'Plant-forward maintenance plan centered on tofu, eggs, oats, rice, fruit, and greens.',
    'maintain',
    array['maintain', 'vegetarian', 'balanced'],
    90000,
    $json${
      "budgetVnd":90000,
      "targetMacros":{"calories":2100,"proteinGrams":115,"carbsGrams":285,"fatGrams":60},
      "plan":{
        "meals":[
          {"name":"Breakfast","entries":[{"foodId":"oats","foodName":"Oats","grams":70,"calories":272,"costVnd":6300},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"banana","foodName":"Banana","grams":100,"calories":89,"costVnd":3500}],"calories":504,"proteinGrams":25.5,"carbsGrams":70.3,"fatGrams":14.6,"costVnd":17800},
          {"name":"Lunch","entries":[{"foodId":"tofu","foodName":"Tofu","grams":300,"calories":228,"costVnd":15000},{"foodId":"rice","foodName":"White rice","grams":280,"calories":364,"costVnd":7000},{"foodId":"greens","foodName":"Morning glory","grams":250,"calories":48,"costVnd":7500}],"calories":640,"proteinGrams":38.1,"carbsGrams":91.8,"fatGrams":16.1,"costVnd":29500},
          {"name":"Snack","entries":[{"foodId":"banana","foodName":"Banana","grams":150,"calories":134,"costVnd":5250},{"foodId":"oats","foodName":"Oats","grams":45,"calories":175,"costVnd":4050}],"calories":309,"proteinGrams":9.3,"carbsGrams":63.3,"fatGrams":3.6,"costVnd":9300},
          {"name":"Dinner","entries":[{"foodId":"tofu","foodName":"Tofu","grams":250,"calories":190,"costVnd":12500},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"rice","foodName":"White rice","grams":220,"calories":286,"costVnd":5500},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":657,"proteinGrams":40.7,"carbsGrams":73.1,"fatGrams":22.3,"costVnd":32000}
        ],
        "totalCalories":2110,
        "totalProteinGrams":113.6,
        "totalCarbsGrams":298.5,
        "totalFatGrams":56.6,
        "totalCostVnd":88600,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  )
on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  tags = excluded.tags,
  budget_vnd = excluded.budget_vnd,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

select pg_notify('pgrst', 'reload schema');
