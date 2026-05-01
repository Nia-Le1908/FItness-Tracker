-- FitBudget seed data

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
  ('Cơm trắng', 'Carbs', 130, 2.70, 28.20, 0.30, 2500, 100, true),
  ('Ức gà', 'Protein', 165, 31.00, 0.00, 3.60, 12000, 100, true),
  ('Trứng gà', 'Protein', 143, 12.60, 1.10, 9.50, 8000, 100, true),
  ('Đậu hũ', 'Protein', 76, 8.00, 1.90, 4.80, 5000, 100, true),
  ('Cá hồi', 'Protein', 208, 20.40, 0.00, 13.40, 28000, 100, true),
  ('Chuối', 'Fruit', 89, 1.10, 22.80, 0.30, 3500, 100, true),
  ('Yến mạch', 'Carbs', 389, 16.90, 66.30, 6.90, 9000, 100, true),
  ('Rau muống', 'Vegetable', 19, 2.60, 3.10, 0.20, 3000, 100, true)
on conflict do nothing;

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
  ),
  (
    'meal-office-prep-balanced',
    'Office Meal Prep Balanced',
    'Practical four-meal workday plan with easy prep and predictable calories.',
    'maintain',
    array['maintain', 'meal-prep', 'office'],
    125000,
    $json${
      "budgetVnd":125000,
      "targetMacros":{"calories":2200,"proteinGrams":140,"carbsGrams":260,"fatGrams":60},
      "plan":{
        "meals":[
          {"name":"Breakfast box","entries":[{"foodId":"oats","foodName":"Oats","grams":60,"calories":233,"costVnd":5400},{"foodId":"banana","foodName":"Banana","grams":120,"calories":107,"costVnd":4200},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000}],"calories":483,"proteinGrams":24.1,"carbsGrams":68.4,"fatGrams":14,"costVnd":17600},
          {"name":"Lunch box","entries":[{"foodId":"chicken","foodName":"Chicken breast","grams":170,"calories":281,"costVnd":20400},{"foodId":"rice","foodName":"White rice","grams":260,"calories":338,"costVnd":6500},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":657,"proteinGrams":63.3,"carbsGrams":79.5,"fatGrams":7.3,"costVnd":32900},
          {"name":"Afternoon snack","entries":[{"foodId":"tofu","foodName":"Tofu","grams":180,"calories":137,"costVnd":9000},{"foodId":"banana","foodName":"Banana","grams":100,"calories":89,"costVnd":3500}],"calories":226,"proteinGrams":15.5,"carbsGrams":26.2,"fatGrams":8.9,"costVnd":12500},
          {"name":"Dinner","entries":[{"foodId":"salmon","foodName":"Salmon","grams":120,"calories":250,"costVnd":33600},{"foodId":"rice","foodName":"White rice","grams":220,"calories":286,"costVnd":5500},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":717,"proteinGrams":45.9,"carbsGrams":69.3,"fatGrams":26.8,"costVnd":53100}
        ],
        "totalCalories":2083,
        "totalProteinGrams":148.8,
        "totalCarbsGrams":243.4,
        "totalFatGrams":57,
        "totalCostVnd":116100,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  ),
  (
    'meal-low-cost-high-protein',
    'Low Cost High Protein',
    'Three larger meals using mostly chicken, tofu, rice, eggs, and greens.',
    'cut',
    array['cut', 'budget', 'high-protein'],
    100000,
    $json${
      "budgetVnd":100000,
      "targetMacros":{"calories":1900,"proteinGrams":155,"carbsGrams":200,"fatGrams":48},
      "plan":{
        "meals":[
          {"name":"Meal 1","entries":[{"foodId":"egg","foodName":"Eggs","grams":150,"calories":215,"costVnd":12000},{"foodId":"oats","foodName":"Oats","grams":60,"calories":233,"costVnd":5400},{"foodId":"banana","foodName":"Banana","grams":100,"calories":89,"costVnd":3500}],"calories":537,"proteinGrams":29.9,"carbsGrams":64.3,"fatGrams":18.7,"costVnd":20900},
          {"name":"Meal 2","entries":[{"foodId":"chicken","foodName":"Chicken breast","grams":220,"calories":363,"costVnd":26400},{"foodId":"rice","foodName":"White rice","grams":240,"calories":312,"costVnd":6000},{"foodId":"greens","foodName":"Morning glory","grams":250,"calories":48,"costVnd":7500}],"calories":723,"proteinGrams":75.2,"carbsGrams":75.4,"fatGrams":9.1,"costVnd":39900},
          {"name":"Meal 3","entries":[{"foodId":"tofu","foodName":"Tofu","grams":250,"calories":190,"costVnd":12500},{"foodId":"chicken","foodName":"Chicken breast","grams":120,"calories":198,"costVnd":14400},{"foodId":"rice","foodName":"White rice","grams":180,"calories":234,"costVnd":4500},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":660,"proteinGrams":61.4,"carbsGrams":55.7,"fatGrams":16.9,"costVnd":37400}
        ],
        "totalCalories":1920,
        "totalProteinGrams":166.5,
        "totalCarbsGrams":195.4,
        "totalFatGrams":44.7,
        "totalCostVnd":98200,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  ),
  (
    'meal-endurance-carb-load',
    'Endurance Carb Load',
    'Higher-carb day for long runs, rides, team sports, or high-volume lower sessions.',
    'maintain',
    array['maintain', 'endurance', 'high-carb'],
    145000,
    $json${
      "budgetVnd":145000,
      "targetMacros":{"calories":3000,"proteinGrams":150,"carbsGrams":450,"fatGrams":58},
      "plan":{
        "meals":[
          {"name":"Pre-training breakfast","entries":[{"foodId":"oats","foodName":"Oats","grams":90,"calories":350,"costVnd":8100},{"foodId":"banana","foodName":"Banana","grams":200,"calories":178,"costVnd":7000},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000}],"calories":671,"proteinGrams":30,"carbsGrams":106,"fatGrams":16,"costVnd":23100},
          {"name":"Post-training lunch","entries":[{"foodId":"rice","foodName":"White rice","grams":350,"calories":455,"costVnd":8750},{"foodId":"chicken","foodName":"Chicken breast","grams":170,"calories":281,"costVnd":20400},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":774,"proteinGrams":63,"carbsGrams":105,"fatGrams":7,"costVnd":35150},
          {"name":"Carb snack","entries":[{"foodId":"rice","foodName":"White rice","grams":200,"calories":260,"costVnd":5000},{"foodId":"banana","foodName":"Banana","grams":150,"calories":134,"costVnd":5250},{"foodId":"oats","foodName":"Oats","grams":50,"calories":195,"costVnd":4500}],"calories":589,"proteinGrams":15,"carbsGrams":112,"fatGrams":4,"costVnd":14750},
          {"name":"Dinner","entries":[{"foodId":"salmon","foodName":"Salmon","grams":120,"calories":250,"costVnd":33600},{"foodId":"rice","foodName":"White rice","grams":300,"calories":390,"costVnd":7500},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":678,"proteinGrams":38,"carbsGrams":91,"fatGrams":17,"costVnd":47100},
          {"name":"Evening top-up","entries":[{"foodId":"tofu","foodName":"Tofu","grams":180,"calories":137,"costVnd":9000},{"foodId":"banana","foodName":"Banana","grams":120,"calories":107,"costVnd":4200}],"calories":244,"proteinGrams":16,"carbsGrams":31,"fatGrams":9,"costVnd":13200}
        ],
        "totalCalories":2956,
        "totalProteinGrams":162,
        "totalCarbsGrams":445,
        "totalFatGrams":53,
        "totalCostVnd":133300,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  ),
  (
    'meal-rest-day-lower-carb',
    'Rest Day Lower Carb',
    'Lower-carb rest-day plan with more protein and fat from eggs, tofu, salmon, and chicken.',
    'maintain',
    array['maintain', 'rest-day', 'lower-carb'],
    135000,
    $json${
      "budgetVnd":135000,
      "targetMacros":{"calories":2000,"proteinGrams":170,"carbsGrams":150,"fatGrams":75},
      "plan":{
        "meals":[
          {"name":"Breakfast","entries":[{"foodId":"egg","foodName":"Eggs","grams":150,"calories":215,"costVnd":12000},{"foodId":"tofu","foodName":"Tofu","grams":150,"calories":114,"costVnd":7500},{"foodId":"banana","foodName":"Banana","grams":80,"calories":71,"costVnd":2800}],"calories":400,"proteinGrams":32,"carbsGrams":25,"fatGrams":22,"costVnd":22300},
          {"name":"Lunch","entries":[{"foodId":"chicken","foodName":"Chicken breast","grams":220,"calories":363,"costVnd":26400},{"foodId":"rice","foodName":"White rice","grams":150,"calories":195,"costVnd":3750},{"foodId":"greens","foodName":"Morning glory","grams":250,"calories":48,"costVnd":7500}],"calories":606,"proteinGrams":75,"carbsGrams":53,"fatGrams":9,"costVnd":37650},
          {"name":"Snack","entries":[{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"tofu","foodName":"Tofu","grams":180,"calories":137,"costVnd":9000}],"calories":280,"proteinGrams":27,"carbsGrams":5,"fatGrams":18,"costVnd":17000},
          {"name":"Dinner","entries":[{"foodId":"salmon","foodName":"Salmon","grams":150,"calories":312,"costVnd":42000},{"foodId":"rice","foodName":"White rice","grams":170,"calories":221,"costVnd":4250},{"foodId":"greens","foodName":"Morning glory","grams":250,"calories":48,"costVnd":7500}],"calories":581,"proteinGrams":43,"carbsGrams":56,"fatGrams":22,"costVnd":53750}
        ],
        "totalCalories":1867,
        "totalProteinGrams":177,
        "totalCarbsGrams":139,
        "totalFatGrams":71,
        "totalCostVnd":130700,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  ),
  (
    'meal-student-budget-maintain',
    'Student Budget Maintain',
    'Three low-prep meals using affordable staples while keeping protein respectable.',
    'maintain',
    array['maintain', 'student', 'budget'],
    90000,
    $json${
      "budgetVnd":90000,
      "targetMacros":{"calories":2000,"proteinGrams":120,"carbsGrams":270,"fatGrams":48},
      "plan":{
        "meals":[
          {"name":"Breakfast","entries":[{"foodId":"oats","foodName":"Oats","grams":70,"calories":272,"costVnd":6300},{"foodId":"banana","foodName":"Banana","grams":150,"calories":134,"costVnd":5250},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000}],"calories":549,"proteinGrams":25,"carbsGrams":82,"fatGrams":15,"costVnd":19550},
          {"name":"Lunch","entries":[{"foodId":"rice","foodName":"White rice","grams":300,"calories":390,"costVnd":7500},{"foodId":"tofu","foodName":"Tofu","grams":250,"calories":190,"costVnd":12500},{"foodId":"greens","foodName":"Morning glory","grams":250,"calories":48,"costVnd":7500}],"calories":628,"proteinGrams":35,"carbsGrams":96,"fatGrams":13,"costVnd":27500},
          {"name":"Dinner","entries":[{"foodId":"chicken","foodName":"Chicken breast","grams":150,"calories":248,"costVnd":18000},{"foodId":"rice","foodName":"White rice","grams":260,"calories":338,"costVnd":6500},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":767,"proteinGrams":68,"carbsGrams":77,"fatGrams":16,"costVnd":38500}
        ],
        "totalCalories":1944,
        "totalProteinGrams":128,
        "totalCarbsGrams":255,
        "totalFatGrams":44,
        "totalCostVnd":85550,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  ),
  (
    'meal-seafood-lean-cut',
    'Seafood Lean Cut',
    'A higher-budget cut template using salmon for variety while keeping calories controlled.',
    'cut',
    array['cut', 'seafood', 'high-protein'],
    170000,
    $json${
      "budgetVnd":170000,
      "targetMacros":{"calories":1900,"proteinGrams":160,"carbsGrams":170,"fatGrams":70},
      "plan":{
        "meals":[
          {"name":"Breakfast","entries":[{"foodId":"egg","foodName":"Eggs","grams":150,"calories":215,"costVnd":12000},{"foodId":"oats","foodName":"Oats","grams":45,"calories":175,"costVnd":4050}],"calories":390,"proteinGrams":27,"carbsGrams":32,"fatGrams":18,"costVnd":16050},
          {"name":"Lunch","entries":[{"foodId":"salmon","foodName":"Salmon","grams":150,"calories":312,"costVnd":42000},{"foodId":"rice","foodName":"White rice","grams":180,"calories":234,"costVnd":4500},{"foodId":"greens","foodName":"Morning glory","grams":250,"calories":48,"costVnd":7500}],"calories":594,"proteinGrams":42,"carbsGrams":59,"fatGrams":21,"costVnd":54000},
          {"name":"Snack","entries":[{"foodId":"tofu","foodName":"Tofu","grams":220,"calories":167,"costVnd":11000},{"foodId":"banana","foodName":"Banana","grams":100,"calories":89,"costVnd":3500}],"calories":256,"proteinGrams":19,"carbsGrams":27,"fatGrams":11,"costVnd":14500},
          {"name":"Dinner","entries":[{"foodId":"chicken","foodName":"Chicken breast","grams":180,"calories":297,"costVnd":21600},{"foodId":"salmon","foodName":"Salmon","grams":90,"calories":187,"costVnd":25200},{"foodId":"rice","foodName":"White rice","grams":150,"calories":195,"costVnd":3750},{"foodId":"greens","foodName":"Morning glory","grams":200,"calories":38,"costVnd":6000}],"calories":717,"proteinGrams":78,"carbsGrams":49,"fatGrams":21,"costVnd":56550}
        ],
        "totalCalories":1957,
        "totalProteinGrams":166,
        "totalCarbsGrams":167,
        "totalFatGrams":71,
        "totalCostVnd":141100,
        "withinBudget":true,
        "withinMacroTargets":true
      }
    }$json$::jsonb,
    true
  ),
  (
    'meal-family-style-bulk',
    'Family Style Bulk',
    'Five larger meals that can be cooked in batches for a high-calorie training block.',
    'bulk',
    array['bulk', 'batch-cook', 'high-calorie'],
    190000,
    $json${
      "budgetVnd":190000,
      "targetMacros":{"calories":3200,"proteinGrams":225,"carbsGrams":420,"fatGrams":85},
      "plan":{
        "meals":[
          {"name":"Breakfast","entries":[{"foodId":"oats","foodName":"Oats","grams":90,"calories":350,"costVnd":8100},{"foodId":"egg","foodName":"Eggs","grams":150,"calories":215,"costVnd":12000},{"foodId":"banana","foodName":"Banana","grams":150,"calories":134,"costVnd":5250}],"calories":699,"proteinGrams":36,"carbsGrams":104,"fatGrams":21,"costVnd":25350},
          {"name":"Lunch","entries":[{"foodId":"rice","foodName":"White rice","grams":350,"calories":455,"costVnd":8750},{"foodId":"chicken","foodName":"Chicken breast","grams":220,"calories":363,"costVnd":26400},{"foodId":"greens","foodName":"Morning glory","grams":250,"calories":48,"costVnd":7500}],"calories":866,"proteinGrams":78,"carbsGrams":109,"fatGrams":10,"costVnd":42650},
          {"name":"Snack","entries":[{"foodId":"tofu","foodName":"Tofu","grams":250,"calories":190,"costVnd":12500},{"foodId":"rice","foodName":"White rice","grams":220,"calories":286,"costVnd":5500},{"foodId":"banana","foodName":"Banana","grams":100,"calories":89,"costVnd":3500}],"calories":565,"proteinGrams":28,"carbsGrams":91,"fatGrams":13,"costVnd":21500},
          {"name":"Dinner","entries":[{"foodId":"salmon","foodName":"Salmon","grams":150,"calories":312,"costVnd":42000},{"foodId":"rice","foodName":"White rice","grams":300,"calories":390,"costVnd":7500},{"foodId":"greens","foodName":"Morning glory","grams":250,"calories":48,"costVnd":7500}],"calories":750,"proteinGrams":45,"carbsGrams":94,"fatGrams":22,"costVnd":57000},
          {"name":"Evening meal","entries":[{"foodId":"chicken","foodName":"Chicken breast","grams":120,"calories":198,"costVnd":14400},{"foodId":"egg","foodName":"Eggs","grams":100,"calories":143,"costVnd":8000},{"foodId":"oats","foodName":"Oats","grams":50,"calories":195,"costVnd":4500}],"calories":536,"proteinGrams":58,"carbsGrams":34,"fatGrams":17,"costVnd":26900}
        ],
        "totalCalories":3416,
        "totalProteinGrams":245,
        "totalCarbsGrams":432,
        "totalFatGrams":83,
        "totalCostVnd":173400,
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

insert into public.workout_plan_templates (
  template_key,
  name,
  description,
  goal,
  experience_level,
  equipment,
  days_per_week,
  tags,
  plan_json,
  is_active
)
values
  (
    'workout-beginner-bodyweight-cut-2day',
    'Beginner Bodyweight Cut 2-Day',
    'Two full-body sessions for beginners who need simple, repeatable training during fat loss.',
    'cut',
    'beginner',
    'bodyweight',
    2,
    array['cut', 'beginner', 'bodyweight'],
    $json${
      "goal":"cut",
      "splitName":"2-Day Bodyweight Full Body",
      "weeklySessions":2,
      "sessionMinutes":35,
      "days":[
        {"name":"Day 1","focus":"full_body","exercises":[{"name":"Bodyweight Squat","sets":3,"reps":"12-15","restSeconds":45,"equipment":"bodyweight"},{"name":"Incline Push-up","sets":3,"reps":"8-12","restSeconds":45,"equipment":"bodyweight"},{"name":"Reverse Lunge","sets":3,"reps":"10-12/side","restSeconds":45,"equipment":"bodyweight"},{"name":"Plank","sets":3,"reps":"30-45s","restSeconds":45,"equipment":"bodyweight"}]},
        {"name":"Day 2","focus":"full_body","exercises":[{"name":"Glute Bridge","sets":3,"reps":"12-15","restSeconds":45,"equipment":"bodyweight"},{"name":"Push-up","sets":3,"reps":"6-12","restSeconds":45,"equipment":"bodyweight"},{"name":"Split Squat","sets":3,"reps":"8-10/side","restSeconds":45,"equipment":"bodyweight"},{"name":"Side Plank","sets":3,"reps":"25-40s/side","restSeconds":45,"equipment":"bodyweight"}]}
      ],
      "totalExercises":8
    }$json$::jsonb,
    true
  ),
  (
    'workout-dumbbell-ppl-maintain-3day',
    'Dumbbell Push Pull Legs 3-Day',
    'A compact dumbbell PPL split for maintaining strength and muscle with limited equipment.',
    'maintain',
    'intermediate',
    'dumbbells',
    3,
    array['maintain', 'dumbbells', 'ppl'],
    $json${
      "goal":"maintain",
      "splitName":"3-Day Dumbbell Push / Pull / Legs",
      "weeklySessions":3,
      "sessionMinutes":55,
      "days":[
        {"name":"Push","focus":"push","exercises":[{"name":"Dumbbell Bench Press","sets":4,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Standing Dumbbell Press","sets":3,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Floor Press","sets":3,"reps":"10-12","restSeconds":60,"equipment":"dumbbells"},{"name":"Dumbbell Lateral Raise","sets":3,"reps":"12-15","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Pull","focus":"pull","exercises":[{"name":"One-Arm Dumbbell Row","sets":4,"reps":"8-12/side","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Romanian Deadlift","sets":4,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Rear Delt Fly","sets":3,"reps":"12-15","restSeconds":45,"equipment":"dumbbells"},{"name":"Dumbbell Curl","sets":3,"reps":"10-12","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Legs","focus":"legs","exercises":[{"name":"Goblet Squat","sets":4,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Walking Lunge","sets":3,"reps":"10-12/side","restSeconds":60,"equipment":"dumbbells"},{"name":"Dumbbell Hip Thrust","sets":3,"reps":"10-15","restSeconds":60,"equipment":"dumbbells"},{"name":"Standing Calf Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"any"}]}
      ],
      "totalExercises":12
    }$json$::jsonb,
    true
  ),
  (
    'workout-dumbbell-upper-lower-maintain-4day',
    'Dumbbell Upper Lower 4-Day',
    'Four sessions that alternate upper and lower body work with moderate volume.',
    'maintain',
    'intermediate',
    'dumbbells',
    4,
    array['maintain', 'upper-lower', 'dumbbells'],
    $json${
      "goal":"maintain",
      "splitName":"4-Day Dumbbell Upper / Lower",
      "weeklySessions":4,
      "sessionMinutes":60,
      "days":[
        {"name":"Upper A","focus":"upper","exercises":[{"name":"Dumbbell Bench Press","sets":4,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"One-Arm Dumbbell Row","sets":4,"reps":"8-10/side","restSeconds":75,"equipment":"dumbbells"},{"name":"Seated Dumbbell Press","sets":3,"reps":"8-12","restSeconds":60,"equipment":"dumbbells"},{"name":"Dumbbell Curl","sets":3,"reps":"10-12","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Lower A","focus":"lower","exercises":[{"name":"Goblet Squat","sets":4,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Romanian Deadlift","sets":4,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Reverse Lunge","sets":3,"reps":"10/side","restSeconds":60,"equipment":"dumbbells"},{"name":"Standing Calf Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"any"}]},
        {"name":"Upper B","focus":"upper","exercises":[{"name":"Incline Dumbbell Press","sets":4,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Chest-Supported Dumbbell Row","sets":4,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Lateral Raise","sets":3,"reps":"12-15","restSeconds":45,"equipment":"dumbbells"},{"name":"Dumbbell Triceps Extension","sets":3,"reps":"10-15","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Lower B","focus":"lower","exercises":[{"name":"Dumbbell Front Squat","sets":4,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Single-Leg Romanian Deadlift","sets":3,"reps":"8-10/side","restSeconds":60,"equipment":"dumbbells"},{"name":"Dumbbell Hip Thrust","sets":4,"reps":"10-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Suitcase Carry","sets":3,"reps":"30-45s/side","restSeconds":60,"equipment":"dumbbells"}]}
      ],
      "totalExercises":16
    }$json$::jsonb,
    true
  ),
  (
    'workout-full-gym-strength-bulk-4day',
    'Full Gym Strength Bulk 4-Day',
    'Upper/lower strength-biased split with enough accessory work for a lean bulk.',
    'bulk',
    'intermediate',
    'full_gym',
    4,
    array['bulk', 'strength', 'full-gym'],
    $json${
      "goal":"bulk",
      "splitName":"4-Day Strength Upper / Lower",
      "weeklySessions":4,
      "sessionMinutes":75,
      "days":[
        {"name":"Upper Strength","focus":"upper","exercises":[{"name":"Bench Press","sets":5,"reps":"4-6","restSeconds":120,"equipment":"full_gym"},{"name":"Barbell Row","sets":5,"reps":"4-6","restSeconds":120,"equipment":"full_gym"},{"name":"Overhead Press","sets":4,"reps":"5-8","restSeconds":90,"equipment":"full_gym"},{"name":"Pull-up","sets":4,"reps":"6-10","restSeconds":90,"equipment":"bodyweight"},{"name":"Face Pull","sets":3,"reps":"12-15","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Lower Strength","focus":"lower","exercises":[{"name":"Back Squat","sets":5,"reps":"4-6","restSeconds":150,"equipment":"full_gym"},{"name":"Romanian Deadlift","sets":4,"reps":"6-8","restSeconds":120,"equipment":"full_gym"},{"name":"Leg Press","sets":4,"reps":"8-10","restSeconds":90,"equipment":"full_gym"},{"name":"Standing Calf Raise","sets":4,"reps":"10-15","restSeconds":60,"equipment":"full_gym"},{"name":"Hanging Knee Raise","sets":3,"reps":"10-15","restSeconds":45,"equipment":"bodyweight"}]},
        {"name":"Upper Volume","focus":"upper","exercises":[{"name":"Incline Dumbbell Press","sets":4,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Lat Pulldown","sets":4,"reps":"8-12","restSeconds":75,"equipment":"full_gym"},{"name":"Seated Cable Row","sets":3,"reps":"10-12","restSeconds":60,"equipment":"full_gym"},{"name":"Lateral Raise","sets":3,"reps":"12-20","restSeconds":45,"equipment":"dumbbells"},{"name":"Cable Triceps Pressdown","sets":3,"reps":"10-15","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Lower Volume","focus":"lower","exercises":[{"name":"Front Squat","sets":4,"reps":"6-8","restSeconds":120,"equipment":"full_gym"},{"name":"Hip Thrust","sets":4,"reps":"8-12","restSeconds":90,"equipment":"full_gym"},{"name":"Walking Lunge","sets":3,"reps":"10-12/side","restSeconds":60,"equipment":"dumbbells"},{"name":"Leg Curl","sets":3,"reps":"10-15","restSeconds":60,"equipment":"full_gym"},{"name":"Cable Crunch","sets":3,"reps":"12-15","restSeconds":45,"equipment":"full_gym"}]}
      ],
      "totalExercises":20
    }$json$::jsonb,
    true
  ),
  (
    'workout-full-gym-hypertrophy-bulk-5day',
    'Full Gym Hypertrophy 5-Day',
    'Higher-volume hypertrophy template for a dedicated muscle-gain block.',
    'bulk',
    'advanced',
    'full_gym',
    5,
    array['bulk', 'hypertrophy', 'full-gym'],
    $json${
      "goal":"bulk",
      "splitName":"5-Day Hypertrophy Specialization",
      "weeklySessions":5,
      "sessionMinutes":75,
      "days":[
        {"name":"Push","focus":"push","exercises":[{"name":"Bench Press","sets":4,"reps":"6-8","restSeconds":90,"equipment":"full_gym"},{"name":"Incline Dumbbell Press","sets":4,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Machine Shoulder Press","sets":3,"reps":"8-12","restSeconds":75,"equipment":"full_gym"},{"name":"Cable Fly","sets":3,"reps":"12-15","restSeconds":45,"equipment":"full_gym"},{"name":"Cable Triceps Pressdown","sets":3,"reps":"10-15","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Pull","focus":"pull","exercises":[{"name":"Weighted Pull-up","sets":4,"reps":"5-8","restSeconds":90,"equipment":"bodyweight"},{"name":"Chest-Supported Row","sets":4,"reps":"8-10","restSeconds":75,"equipment":"full_gym"},{"name":"Lat Pulldown","sets":3,"reps":"10-12","restSeconds":60,"equipment":"full_gym"},{"name":"Rear Delt Fly","sets":3,"reps":"12-20","restSeconds":45,"equipment":"dumbbells"},{"name":"EZ-Bar Curl","sets":3,"reps":"10-12","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Legs","focus":"legs","exercises":[{"name":"Back Squat","sets":4,"reps":"6-8","restSeconds":120,"equipment":"full_gym"},{"name":"Romanian Deadlift","sets":4,"reps":"8-10","restSeconds":90,"equipment":"full_gym"},{"name":"Leg Press","sets":4,"reps":"10-12","restSeconds":75,"equipment":"full_gym"},{"name":"Leg Curl","sets":3,"reps":"10-15","restSeconds":60,"equipment":"full_gym"},{"name":"Seated Calf Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Upper Pump","focus":"upper","exercises":[{"name":"Dumbbell Bench Press","sets":3,"reps":"10-12","restSeconds":60,"equipment":"dumbbells"},{"name":"Seated Cable Row","sets":3,"reps":"10-12","restSeconds":60,"equipment":"full_gym"},{"name":"Lateral Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"dumbbells"},{"name":"Face Pull","sets":3,"reps":"12-20","restSeconds":45,"equipment":"full_gym"},{"name":"Hammer Curl","sets":3,"reps":"10-15","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Lower Pump","focus":"lower","exercises":[{"name":"Front Squat","sets":3,"reps":"8-10","restSeconds":90,"equipment":"full_gym"},{"name":"Hip Thrust","sets":4,"reps":"8-12","restSeconds":75,"equipment":"full_gym"},{"name":"Bulgarian Split Squat","sets":3,"reps":"10/side","restSeconds":60,"equipment":"dumbbells"},{"name":"Leg Extension","sets":3,"reps":"12-15","restSeconds":45,"equipment":"full_gym"},{"name":"Cable Crunch","sets":3,"reps":"12-15","restSeconds":45,"equipment":"full_gym"}]}
      ],
      "totalExercises":25
    }$json$::jsonb,
    true
  ),
  (
    'workout-full-gym-minimalist-cut-3day',
    'Full Gym Minimalist Cut 3-Day',
    'Low-friction full-body plan that keeps strength practice high during a calorie deficit.',
    'cut',
    'intermediate',
    'full_gym',
    3,
    array['cut', 'minimalist', 'full-body'],
    $json${
      "goal":"cut",
      "splitName":"3-Day Minimalist Full Body",
      "weeklySessions":3,
      "sessionMinutes":45,
      "days":[
        {"name":"Full Body A","focus":"full_body","exercises":[{"name":"Back Squat","sets":3,"reps":"5-8","restSeconds":90,"equipment":"full_gym"},{"name":"Bench Press","sets":3,"reps":"6-10","restSeconds":90,"equipment":"full_gym"},{"name":"Seated Row","sets":3,"reps":"8-12","restSeconds":60,"equipment":"full_gym"}]},
        {"name":"Full Body B","focus":"full_body","exercises":[{"name":"Deadlift","sets":3,"reps":"3-5","restSeconds":120,"equipment":"full_gym"},{"name":"Overhead Press","sets":3,"reps":"6-10","restSeconds":90,"equipment":"full_gym"},{"name":"Lat Pulldown","sets":3,"reps":"8-12","restSeconds":60,"equipment":"full_gym"}]},
        {"name":"Full Body C","focus":"full_body","exercises":[{"name":"Front Squat","sets":3,"reps":"5-8","restSeconds":90,"equipment":"full_gym"},{"name":"Incline Dumbbell Press","sets":3,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Romanian Deadlift","sets":3,"reps":"8-10","restSeconds":75,"equipment":"full_gym"}]}
      ],
      "totalExercises":9
    }$json$::jsonb,
    true
  ),
  (
    'workout-advanced-ppl-bulk-6day',
    'Advanced PPL Bulk 6-Day',
    'High-frequency push/pull/legs rotation for advanced lifters in a surplus.',
    'bulk',
    'advanced',
    'full_gym',
    6,
    array['bulk', 'advanced', 'ppl'],
    $json${
      "goal":"bulk",
      "splitName":"6-Day Push / Pull / Legs x2",
      "weeklySessions":6,
      "sessionMinutes":80,
      "days":[
        {"name":"Push A","focus":"push","exercises":[{"name":"Bench Press","sets":5,"reps":"4-6","restSeconds":120,"equipment":"full_gym"},{"name":"Overhead Press","sets":4,"reps":"5-8","restSeconds":90,"equipment":"full_gym"},{"name":"Incline Dumbbell Press","sets":3,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Lateral Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"dumbbells"},{"name":"Cable Triceps Pressdown","sets":3,"reps":"10-15","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Pull A","focus":"pull","exercises":[{"name":"Weighted Pull-up","sets":5,"reps":"4-6","restSeconds":120,"equipment":"bodyweight"},{"name":"Barbell Row","sets":4,"reps":"5-8","restSeconds":90,"equipment":"full_gym"},{"name":"Lat Pulldown","sets":3,"reps":"8-12","restSeconds":75,"equipment":"full_gym"},{"name":"Rear Delt Fly","sets":3,"reps":"12-20","restSeconds":45,"equipment":"dumbbells"},{"name":"Barbell Curl","sets":3,"reps":"8-12","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Legs A","focus":"legs","exercises":[{"name":"Back Squat","sets":5,"reps":"4-6","restSeconds":150,"equipment":"full_gym"},{"name":"Romanian Deadlift","sets":4,"reps":"6-8","restSeconds":120,"equipment":"full_gym"},{"name":"Leg Press","sets":4,"reps":"8-12","restSeconds":90,"equipment":"full_gym"},{"name":"Leg Curl","sets":3,"reps":"10-15","restSeconds":60,"equipment":"full_gym"},{"name":"Standing Calf Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Push B","focus":"push","exercises":[{"name":"Incline Bench Press","sets":4,"reps":"6-8","restSeconds":90,"equipment":"full_gym"},{"name":"Dumbbell Shoulder Press","sets":4,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Machine Chest Press","sets":3,"reps":"10-12","restSeconds":60,"equipment":"full_gym"},{"name":"Cable Fly","sets":3,"reps":"12-15","restSeconds":45,"equipment":"full_gym"},{"name":"Overhead Cable Triceps Extension","sets":3,"reps":"10-15","restSeconds":45,"equipment":"full_gym"}]},
        {"name":"Pull B","focus":"pull","exercises":[{"name":"Deadlift","sets":3,"reps":"3-5","restSeconds":150,"equipment":"full_gym"},{"name":"Chest-Supported Row","sets":4,"reps":"8-10","restSeconds":75,"equipment":"full_gym"},{"name":"Seated Cable Row","sets":3,"reps":"10-12","restSeconds":60,"equipment":"full_gym"},{"name":"Face Pull","sets":3,"reps":"12-20","restSeconds":45,"equipment":"full_gym"},{"name":"Hammer Curl","sets":3,"reps":"10-12","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Legs B","focus":"legs","exercises":[{"name":"Front Squat","sets":4,"reps":"5-8","restSeconds":120,"equipment":"full_gym"},{"name":"Hip Thrust","sets":4,"reps":"8-12","restSeconds":90,"equipment":"full_gym"},{"name":"Bulgarian Split Squat","sets":3,"reps":"8-10/side","restSeconds":75,"equipment":"dumbbells"},{"name":"Leg Extension","sets":3,"reps":"12-15","restSeconds":45,"equipment":"full_gym"},{"name":"Seated Calf Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"full_gym"}]}
      ],
      "totalExercises":30
    }$json$::jsonb,
    true
  ),
  (
    'workout-lower-emphasis-recomp-4day',
    'Lower Emphasis Recomposition 4-Day',
    'Balanced upper/lower plan with extra lower-body volume for recomposition goals.',
    'maintain',
    'intermediate',
    'dumbbells',
    4,
    array['maintain', 'recomposition', 'lower-emphasis'],
    $json${
      "goal":"maintain",
      "splitName":"4-Day Lower Emphasis Upper / Lower",
      "weeklySessions":4,
      "sessionMinutes":60,
      "days":[
        {"name":"Lower Strength","focus":"lower","exercises":[{"name":"Goblet Squat","sets":4,"reps":"6-10","restSeconds":90,"equipment":"dumbbells"},{"name":"Dumbbell Romanian Deadlift","sets":4,"reps":"8-10","restSeconds":90,"equipment":"dumbbells"},{"name":"Dumbbell Hip Thrust","sets":4,"reps":"8-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Standing Calf Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"any"}]},
        {"name":"Upper Strength","focus":"upper","exercises":[{"name":"Dumbbell Bench Press","sets":4,"reps":"6-10","restSeconds":75,"equipment":"dumbbells"},{"name":"One-Arm Dumbbell Row","sets":4,"reps":"8-10/side","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Shoulder Press","sets":3,"reps":"8-12","restSeconds":60,"equipment":"dumbbells"},{"name":"Rear Delt Fly","sets":3,"reps":"12-15","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Lower Volume","focus":"lower","exercises":[{"name":"Dumbbell Front Squat","sets":3,"reps":"10-12","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Walking Lunge","sets":3,"reps":"10-12/side","restSeconds":60,"equipment":"dumbbells"},{"name":"Single-Leg Romanian Deadlift","sets":3,"reps":"10/side","restSeconds":60,"equipment":"dumbbells"},{"name":"Suitcase Carry","sets":3,"reps":"30-45s/side","restSeconds":60,"equipment":"dumbbells"}]},
        {"name":"Upper Volume","focus":"upper","exercises":[{"name":"Incline Dumbbell Press","sets":3,"reps":"10-12","restSeconds":60,"equipment":"dumbbells"},{"name":"Chest-Supported Dumbbell Row","sets":3,"reps":"10-12","restSeconds":60,"equipment":"dumbbells"},{"name":"Lateral Raise","sets":3,"reps":"12-20","restSeconds":45,"equipment":"dumbbells"},{"name":"Dumbbell Curl","sets":3,"reps":"10-15","restSeconds":45,"equipment":"dumbbells"}]}
      ],
      "totalExercises":16
    }$json$::jsonb,
    true
  ),
  (
    'workout-bodyweight-conditioning-cut-3day',
    'Bodyweight Conditioning Cut 3-Day',
    'Bodyweight strength circuits for fat-loss phases without gym access.',
    'cut',
    'beginner',
    'bodyweight',
    3,
    array['cut', 'conditioning', 'bodyweight'],
    $json${
      "goal":"cut",
      "splitName":"3-Day Bodyweight Conditioning",
      "weeklySessions":3,
      "sessionMinutes":40,
      "days":[
        {"name":"Circuit A","focus":"full_body","exercises":[{"name":"Bodyweight Squat","sets":4,"reps":"15-20","restSeconds":30,"equipment":"bodyweight"},{"name":"Push-up","sets":4,"reps":"AMRAP","restSeconds":30,"equipment":"bodyweight"},{"name":"Reverse Lunge","sets":3,"reps":"12/side","restSeconds":30,"equipment":"bodyweight"},{"name":"Mountain Climber","sets":3,"reps":"30-45s","restSeconds":30,"equipment":"bodyweight"},{"name":"Plank","sets":3,"reps":"45-60s","restSeconds":30,"equipment":"bodyweight"}]},
        {"name":"Circuit B","focus":"full_body","exercises":[{"name":"Split Squat","sets":4,"reps":"10-12/side","restSeconds":30,"equipment":"bodyweight"},{"name":"Pike Push-up","sets":3,"reps":"6-10","restSeconds":45,"equipment":"bodyweight"},{"name":"Glute Bridge","sets":4,"reps":"15-20","restSeconds":30,"equipment":"bodyweight"},{"name":"Burpee","sets":3,"reps":"8-12","restSeconds":45,"equipment":"bodyweight"},{"name":"Side Plank","sets":3,"reps":"30-45s/side","restSeconds":30,"equipment":"bodyweight"}]},
        {"name":"Circuit C","focus":"full_body","exercises":[{"name":"Tempo Squat","sets":4,"reps":"10-12","restSeconds":45,"equipment":"bodyweight"},{"name":"Close-Grip Push-up","sets":3,"reps":"6-12","restSeconds":45,"equipment":"bodyweight"},{"name":"Single-Leg Glute Bridge","sets":3,"reps":"10-12/side","restSeconds":30,"equipment":"bodyweight"},{"name":"High Knees","sets":4,"reps":"30s","restSeconds":30,"equipment":"bodyweight"},{"name":"Dead Bug","sets":3,"reps":"10-12/side","restSeconds":30,"equipment":"bodyweight"}]}
      ],
      "totalExercises":15
    }$json$::jsonb,
    true
  ),
  (
    'workout-dumbbell-hybrid-cut-5day',
    'Dumbbell Hybrid Cut 5-Day',
    'Shorter dumbbell sessions combining strength maintenance and conditioning density.',
    'cut',
    'intermediate',
    'dumbbells',
    5,
    array['cut', 'hybrid', 'dumbbells'],
    $json${
      "goal":"cut",
      "splitName":"5-Day Dumbbell Hybrid",
      "weeklySessions":5,
      "sessionMinutes":50,
      "days":[
        {"name":"Push Strength","focus":"push","exercises":[{"name":"Dumbbell Bench Press","sets":4,"reps":"6-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Standing Dumbbell Press","sets":4,"reps":"6-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Push-up","sets":3,"reps":"AMRAP","restSeconds":45,"equipment":"bodyweight"},{"name":"Dumbbell Lateral Raise","sets":3,"reps":"12-20","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Pull Strength","focus":"pull","exercises":[{"name":"One-Arm Dumbbell Row","sets":4,"reps":"8-10/side","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Romanian Deadlift","sets":4,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Rear Delt Fly","sets":3,"reps":"12-20","restSeconds":45,"equipment":"dumbbells"},{"name":"Dumbbell Hammer Curl","sets":3,"reps":"10-12","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Legs Strength","focus":"legs","exercises":[{"name":"Goblet Squat","sets":4,"reps":"8-10","restSeconds":75,"equipment":"dumbbells"},{"name":"Dumbbell Walking Lunge","sets":3,"reps":"10/side","restSeconds":60,"equipment":"dumbbells"},{"name":"Dumbbell Hip Thrust","sets":4,"reps":"10-12","restSeconds":60,"equipment":"dumbbells"},{"name":"Standing Calf Raise","sets":4,"reps":"12-20","restSeconds":45,"equipment":"any"}]},
        {"name":"Upper Density","focus":"upper","exercises":[{"name":"Incline Dumbbell Press","sets":3,"reps":"10-12","restSeconds":45,"equipment":"dumbbells"},{"name":"Chest-Supported Dumbbell Row","sets":3,"reps":"10-12","restSeconds":45,"equipment":"dumbbells"},{"name":"Dumbbell Curl to Press","sets":3,"reps":"8-10","restSeconds":45,"equipment":"dumbbells"},{"name":"Farmer Carry","sets":4,"reps":"30-45s","restSeconds":45,"equipment":"dumbbells"}]},
        {"name":"Lower Conditioning","focus":"lower","exercises":[{"name":"Dumbbell Front Squat","sets":3,"reps":"12-15","restSeconds":45,"equipment":"dumbbells"},{"name":"Single-Leg Romanian Deadlift","sets":3,"reps":"10/side","restSeconds":45,"equipment":"dumbbells"},{"name":"Reverse Lunge","sets":3,"reps":"12/side","restSeconds":45,"equipment":"dumbbells"},{"name":"Plank Row","sets":3,"reps":"8-10/side","restSeconds":45,"equipment":"dumbbells"}]}
      ],
      "totalExercises":20
    }$json$::jsonb,
    true
  )
on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  experience_level = excluded.experience_level,
  equipment = excluded.equipment,
  days_per_week = excluded.days_per_week,
  tags = excluded.tags,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());
