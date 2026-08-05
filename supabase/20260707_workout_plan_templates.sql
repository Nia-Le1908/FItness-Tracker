-- 20260707_workout_plan_templates.sql
-- Pre-built workout plan templates for the "Browse Plans" feature.
-- Includes table definition (if not already created via Supabase dashboard)
-- and seed data with 6 popular workout routines.

create extension if not exists pgcrypto;

-- =========================================================
-- Table definition (safe to rerun)
-- =========================================================
create table if not exists public.workout_plan_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  name text not null,
  description text not null default '',
  goal text not null check (goal in ('cut', 'maintain', 'bulk')),
  tags text[] not null default '{}',
  experience_level text not null default 'beginner'
    check (experience_level in ('beginner', 'intermediate', 'advanced')),
  days_per_week smallint not null check (days_per_week between 1 and 7),
  equipment text not null default 'full_gym'
    check (equipment in ('bodyweight', 'dumbbells', 'full_gym')),
  plan_json jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists workout_plan_templates_template_key_key
  on public.workout_plan_templates (template_key);

-- =========================================================
-- Seed data
-- =========================================================

-- 1) Beginner Full Body 2x/week (bodyweight)
insert into public.workout_plan_templates (
  template_key, name, description, goal, tags, experience_level,
  days_per_week, equipment, plan_json, is_active
) values (
  'beginner-fullbody-2',
  'Beginner Full Body',
  'Perfect for absolute beginners. Two full-body sessions per week with bodyweight exercises only — no equipment needed.',
  'maintain',
  '{"beginner","bodyweight","full body","home"}',
  'beginner',
  2,
  'bodyweight',
  $json${
    "goal": "maintain",
    "splitName": "Full Body x2",
    "weeklySessions": 2,
    "sessionMinutes": 40,
    "days": [
      {
        "name": "Day 1 - Full Body",
        "focus": "full_body",
        "exercises": [
          {"name": "Bodyweight Squat", "sets": 3, "reps": "12-15", "restSeconds": 60, "equipment": "bodyweight"},
          {"name": "Push-up", "sets": 3, "reps": "8-12", "restSeconds": 60, "equipment": "bodyweight"},
          {"name": "Inverted Row", "sets": 3, "reps": "8-12", "restSeconds": 60, "equipment": "bodyweight"},
          {"name": "Reverse Lunge", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "bodyweight"},
          {"name": "Plank", "sets": 3, "reps": "30-45s", "restSeconds": 45, "equipment": "bodyweight"}
        ]
      },
      {
        "name": "Day 2 - Full Body",
        "focus": "full_body",
        "exercises": [
          {"name": "Bulgarian Split Squat", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "bodyweight"},
          {"name": "Decline Push-up", "sets": 3, "reps": "8-12", "restSeconds": 60, "equipment": "bodyweight"},
          {"name": "Inverted Row", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "bodyweight"},
          {"name": "Glute Bridge", "sets": 3, "reps": "15-20", "restSeconds": 45, "equipment": "bodyweight"},
          {"name": "Dead Bug", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "bodyweight"}
        ]
      }
    ],
    "totalExercises": 10
  }$json$::jsonb,
  true
) on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  tags = excluded.tags,
  experience_level = excluded.experience_level,
  days_per_week = excluded.days_per_week,
  equipment = excluded.equipment,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- 2) PPL 3-day (classic Push/Pull/Legs for full gym)
insert into public.workout_plan_templates (
  template_key, name, description, goal, tags, experience_level,
  days_per_week, equipment, plan_json, is_active
) values (
  'ppl-3day-gym',
  'Push / Pull / Legs (3-Day)',
  'The classic PPL split — 3 days a week. Ideal for intermediates who want balanced muscle development with full gym access.',
  'maintain',
  '{"ppl","push pull legs","full gym","intermediate","classic"}',
  'intermediate',
  3,
  'full_gym',
  $json${
    "goal": "maintain",
    "splitName": "Push / Pull / Legs",
    "weeklySessions": 3,
    "sessionMinutes": 60,
    "days": [
      {
        "name": "Day 1 - Push",
        "focus": "push",
        "exercises": [
          {"name": "Barbell Bench Press", "sets": 4, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Overhead Press", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Lateral Raise", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Cable Triceps Pushdown", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "full_gym"}
        ]
      },
      {
        "name": "Day 2 - Pull",
        "focus": "pull",
        "exercises": [
          {"name": "Pull-up", "sets": 3, "reps": "8-12", "restSeconds": 75, "equipment": "bodyweight"},
          {"name": "Barbell Row", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Seated Cable Row", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Face Pull", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Dumbbell Curl", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "dumbbells"}
        ]
      },
      {
        "name": "Day 3 - Legs",
        "focus": "legs",
        "exercises": [
          {"name": "Barbell Back Squat", "sets": 4, "reps": "8-10", "restSeconds": 75, "equipment": "full_gym"},
          {"name": "Romanian Deadlift", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Leg Press", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Leg Curl", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Standing Calf Raise", "sets": 3, "reps": "15-20", "restSeconds": 45, "equipment": "any"}
        ]
      }
    ],
    "totalExercises": 15
  }$json$::jsonb,
  true
) on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  tags = excluded.tags,
  experience_level = excluded.experience_level,
  days_per_week = excluded.days_per_week,
  equipment = excluded.equipment,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- 3) Upper/Lower 4-day (muscle building focus)
insert into public.workout_plan_templates (
  template_key, name, description, goal, tags, experience_level,
  days_per_week, equipment, plan_json, is_active
) values (
  'upper-lower-4day',
  'Upper / Lower (4-Day)',
  'Four sessions a week alternating upper and lower body. Great for building strength and muscle with full gym access.',
  'bulk',
  '{"upper lower","4 day","hypertrophy","full gym","intermediate"}',
  'intermediate',
  4,
  'full_gym',
  $json${
    "goal": "bulk",
    "splitName": "Upper / Lower",
    "weeklySessions": 4,
    "sessionMinutes": 60,
    "days": [
      {
        "name": "Day 1 - Upper A",
        "focus": "upper",
        "exercises": [
          {"name": "Barbell Bench Press", "sets": 4, "reps": "6-8", "restSeconds": 75, "equipment": "full_gym"},
          {"name": "Barbell Row", "sets": 4, "reps": "6-8", "restSeconds": 75, "equipment": "full_gym"},
          {"name": "Overhead Press", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Pull-up", "sets": 3, "reps": "8-12", "restSeconds": 60, "equipment": "bodyweight"},
          {"name": "Dumbbell Curl", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Cable Triceps Pushdown", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "full_gym"}
        ]
      },
      {
        "name": "Day 2 - Lower A",
        "focus": "lower",
        "exercises": [
          {"name": "Barbell Back Squat", "sets": 4, "reps": "6-8", "restSeconds": 90, "equipment": "full_gym"},
          {"name": "Romanian Deadlift", "sets": 3, "reps": "8-10", "restSeconds": 75, "equipment": "full_gym"},
          {"name": "Leg Press", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Leg Curl", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Standing Calf Raise", "sets": 4, "reps": "12-15", "restSeconds": 45, "equipment": "any"}
        ]
      },
      {
        "name": "Day 3 - Upper B",
        "focus": "upper",
        "exercises": [
          {"name": "Incline Dumbbell Press", "sets": 4, "reps": "8-10", "restSeconds": 75, "equipment": "dumbbells"},
          {"name": "Seated Cable Row", "sets": 4, "reps": "8-10", "restSeconds": 75, "equipment": "full_gym"},
          {"name": "Seated Dumbbell Press", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Lateral Raise", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Hammer Curl", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Overhead Triceps Extension", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "dumbbells"}
        ]
      },
      {
        "name": "Day 4 - Lower B",
        "focus": "lower",
        "exercises": [
          {"name": "Conventional Deadlift", "sets": 4, "reps": "5-6", "restSeconds": 90, "equipment": "full_gym"},
          {"name": "Front Squat", "sets": 3, "reps": "8-10", "restSeconds": 75, "equipment": "full_gym"},
          {"name": "Hip Thrust", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Walking Lunge", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Seated Calf Raise", "sets": 4, "reps": "12-15", "restSeconds": 45, "equipment": "full_gym"}
        ]
      }
    ],
    "totalExercises": 22
  }$json$::jsonb,
  true
) on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  tags = excluded.tags,
  experience_level = excluded.experience_level,
  days_per_week = excluded.days_per_week,
  equipment = excluded.equipment,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- 4) PPL 6-day (advanced double split)
insert into public.workout_plan_templates (
  template_key, name, description, goal, tags, experience_level,
  days_per_week, equipment, plan_json, is_active
) values (
  'ppl-6day-advanced',
  'Push / Pull / Legs x2 (6-Day)',
  'Advanced double PPL — hit every muscle group twice a week. High volume, high frequency. For experienced lifters with full gym access.',
  'bulk',
  '{"ppl","6 day","advanced","hypertrophy","full gym","double split"}',
  'advanced',
  6,
  'full_gym',
  $json${
    "goal": "bulk",
    "splitName": "Push / Pull / Legs x2",
    "weeklySessions": 6,
    "sessionMinutes": 70,
    "days": [
      {
        "name": "Day 1 - Push A (Strength)",
        "focus": "push",
        "exercises": [
          {"name": "Barbell Bench Press", "sets": 5, "reps": "5-6", "restSeconds": 90, "equipment": "full_gym"},
          {"name": "Overhead Press", "sets": 4, "reps": "6-8", "restSeconds": 75, "equipment": "full_gym"},
          {"name": "Incline Dumbbell Press", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Lateral Raise", "sets": 4, "reps": "12-15", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Skull Crusher", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "full_gym"}
        ]
      },
      {
        "name": "Day 2 - Pull A (Strength)",
        "focus": "pull",
        "exercises": [
          {"name": "Pull-up", "sets": 4, "reps": "6-10", "restSeconds": 75, "equipment": "bodyweight"},
          {"name": "Barbell Row", "sets": 4, "reps": "6-8", "restSeconds": 75, "equipment": "full_gym"},
          {"name": "T-Bar Row", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Face Pull", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Barbell Curl", "sets": 3, "reps": "8-10", "restSeconds": 45, "equipment": "full_gym"}
        ]
      },
      {
        "name": "Day 3 - Legs A (Strength)",
        "focus": "legs",
        "exercises": [
          {"name": "Barbell Back Squat", "sets": 5, "reps": "5-6", "restSeconds": 90, "equipment": "full_gym"},
          {"name": "Conventional Deadlift", "sets": 3, "reps": "5-5", "restSeconds": 90, "equipment": "full_gym"},
          {"name": "Leg Press", "sets": 3, "reps": "8-10", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Leg Curl", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Standing Calf Raise", "sets": 4, "reps": "12-15", "restSeconds": 45, "equipment": "any"}
        ]
      },
      {
        "name": "Day 4 - Push B (Hypertrophy)",
        "focus": "push",
        "exercises": [
          {"name": "Incline Dumbbell Press", "sets": 4, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Cable Fly", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Arnold Press", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Upright Row", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Dips", "sets": 3, "reps": "10-15", "restSeconds": 45, "equipment": "bodyweight"}
        ]
      },
      {
        "name": "Day 5 - Pull B (Hypertrophy)",
        "focus": "pull",
        "exercises": [
          {"name": "Chin-up", "sets": 3, "reps": "8-12", "restSeconds": 60, "equipment": "bodyweight"},
          {"name": "Seated Cable Row", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Straight-Arm Pulldown", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Incline Dumbbell Curl", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Hammer Curl", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "dumbbells"}
        ]
      },
      {
        "name": "Day 6 - Legs B (Hypertrophy)",
        "focus": "legs",
        "exercises": [
          {"name": "Hack Squat", "sets": 4, "reps": "10-12", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Romanian Deadlift", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "full_gym"},
          {"name": "Bulgarian Split Squat", "sets": 3, "reps": "10-12", "restSeconds": 75, "equipment": "dumbbells"},
          {"name": "Leg Extension", "sets": 3, "reps": "15-20", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Cable Kickback", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "full_gym"},
          {"name": "Seated Calf Raise", "sets": 4, "reps": "15-20", "restSeconds": 45, "equipment": "full_gym"}
        ]
      }
    ],
    "totalExercises": 29
  }$json$::jsonb,
  true
) on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  tags = excluded.tags,
  experience_level = excluded.experience_level,
  days_per_week = excluded.days_per_week,
  equipment = excluded.equipment,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- 5) Dumbbell Only Full Body 3x/week
insert into public.workout_plan_templates (
  template_key, name, description, goal, tags, experience_level,
  days_per_week, equipment, plan_json, is_active
) values (
  'dumbbell-fullbody-3',
  'Dumbbell Full Body (3-Day)',
  'Train at home with just a pair of dumbbells. Three full-body sessions per week — perfect for home gym setups.',
  'maintain',
  '{"dumbbells","home","full body","3 day","beginner"}',
  'beginner',
  3,
  'dumbbells',
  $json${
    "goal": "maintain",
    "splitName": "Push / Pull / Legs",
    "weeklySessions": 3,
    "sessionMinutes": 45,
    "days": [
      {
        "name": "Day 1 - Full Body A",
        "focus": "full_body",
        "exercises": [
          {"name": "Goblet Squat", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Dumbbell Bench Press", "sets": 3, "reps": "8-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Dumbbell Row", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Seated Dumbbell Press", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Dumbbell RDL", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"}
        ]
      },
      {
        "name": "Day 2 - Full Body B",
        "focus": "full_body",
        "exercises": [
          {"name": "Bulgarian Split Squat", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "One-Arm Dumbbell Row", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Lateral Raise", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Hammer Curl", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "dumbbells"}
        ]
      },
      {
        "name": "Day 3 - Full Body C",
        "focus": "full_body",
        "exercises": [
          {"name": "Thruster", "sets": 3, "reps": "10-12", "restSeconds": 75, "equipment": "dumbbells"},
          {"name": "Walking Lunge", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Dumbbell Bench Press", "sets": 3, "reps": "10-12", "restSeconds": 60, "equipment": "dumbbells"},
          {"name": "Dumbbell Row", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "dumbbells"},
          {"name": "Overhead Triceps Extension", "sets": 3, "reps": "12-15", "restSeconds": 45, "equipment": "dumbbells"}
        ]
      }
    ],
    "totalExercises": 15
  }$json$::jsonb,
  true
) on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  tags = excluded.tags,
  experience_level = excluded.experience_level,
  days_per_week = excluded.days_per_week,
  equipment = excluded.equipment,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- 6) Bodyweight HIIT 3x/week (cutting / fat loss focus)
insert into public.workout_plan_templates (
  template_key, name, description, goal, tags, experience_level,
  days_per_week, equipment, plan_json, is_active
) values (
  'bodyweight-cut-3',
  'Bodyweight Fat Burner (3-Day)',
  'No equipment, high intensity. Three bodyweight circuits per week designed for fat loss and conditioning. Perfect for cutting phases.',
  'cut',
  '{"bodyweight","hiit","cut","fat loss","home","beginner"}',
  'beginner',
  3,
  'bodyweight',
  $json${
    "goal": "cut",
    "splitName": "Push / Pull / Legs",
    "weeklySessions": 3,
    "sessionMinutes": 35,
    "days": [
      {
        "name": "Day 1 - Push + Core",
        "focus": "push",
        "exercises": [
          {"name": "Push-up", "sets": 4, "reps": "12-15", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Diamond Push-up", "sets": 3, "reps": "10-12", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Decline Push-up", "sets": 3, "reps": "10-12", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Dips", "sets": 3, "reps": "10-15", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Plank", "sets": 3, "reps": "45s", "restSeconds": 30, "equipment": "bodyweight"}
        ]
      },
      {
        "name": "Day 2 - Pull + Cardio",
        "focus": "pull",
        "exercises": [
          {"name": "Pull-up", "sets": 4, "reps": "6-10", "restSeconds": 45, "equipment": "bodyweight"},
          {"name": "Inverted Row", "sets": 3, "reps": "10-15", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Inverted Row", "sets": 3, "reps": "10-12", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Dead Bug", "sets": 3, "reps": "12-15", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Burpee", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "bodyweight"}
        ]
      },
      {
        "name": "Day 3 - Legs + Finisher",
        "focus": "legs",
        "exercises": [
          {"name": "Bodyweight Squat", "sets": 4, "reps": "15-20", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Reverse Lunge", "sets": 3, "reps": "12-15", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Sissy Squat", "sets": 3, "reps": "10-12", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Glute Bridge", "sets": 3, "reps": "15-20", "restSeconds": 30, "equipment": "bodyweight"},
          {"name": "Burpee", "sets": 3, "reps": "10-12", "restSeconds": 45, "equipment": "bodyweight"}
        ]
      }
    ],
    "totalExercises": 15
  }$json$::jsonb,
  true
) on conflict (template_key) do update set
  name = excluded.name,
  description = excluded.description,
  goal = excluded.goal,
  tags = excluded.tags,
  experience_level = excluded.experience_level,
  days_per_week = excluded.days_per_week,
  equipment = excluded.equipment,
  plan_json = excluded.plan_json,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

select pg_notify('pgrst', 'reload schema');
