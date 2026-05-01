-- FitBudget Supabase schema
-- Run this in the Supabase SQL editor or as a migration.

create extension if not exists pgcrypto;

-- Generic updated_at helper.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Public profile table that extends Supabase Auth.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  height_cm numeric(5, 2),
  birth_date date,
  sex text check (sex in ('male', 'female', 'other')),
  goal text check (goal in ('cut', 'maintain', 'bulk')),
  daily_budget_vnd integer check (daily_budget_vnd >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();


create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  calories_per_100g numeric(8, 2) not null check (calories_per_100g >= 0),
  protein_per_100g numeric(8, 2) not null check (protein_per_100g >= 0),
  carbs_per_100g numeric(8, 2) not null check (carbs_per_100g >= 0),
  fat_per_100g numeric(8, 2) not null check (fat_per_100g >= 0),
  cost_per_100g_vnd integer not null check (cost_per_100g_vnd >= 0),
  serving_size_g integer not null default 100 check (serving_size_g > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists foods_set_updated_at on public.foods;
create trigger foods_set_updated_at
before update on public.foods
for each row execute function public.set_updated_at();

create index if not exists idx_foods_category on public.foods (category);
create index if not exists idx_foods_active on public.foods (is_active);

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_date date not null,
  budget_vnd integer not null check (budget_vnd >= 0),
  target_calories integer not null check (target_calories >= 0),
  target_protein_g numeric(8, 2) not null check (target_protein_g >= 0),
  target_carbs_g numeric(8, 2) not null check (target_carbs_g >= 0),
  target_fat_g numeric(8, 2) not null check (target_fat_g >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, plan_date)
);

drop trigger if exists daily_plans_set_updated_at on public.daily_plans;
create trigger daily_plans_set_updated_at
before update on public.daily_plans
for each row execute function public.set_updated_at();

create index if not exists idx_daily_plans_user_id on public.daily_plans (user_id);
create index if not exists idx_daily_plans_plan_date on public.daily_plans (plan_date);
create index if not exists idx_daily_plans_user_date on public.daily_plans (user_id, plan_date desc);

create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  recorded_at timestamptz not null default timezone('utc', now()),
  weight_kg numeric(6, 2) not null check (weight_kg > 0),
  body_fat_percent numeric(5, 2) check (body_fat_percent >= 0 and body_fat_percent <= 100),
  waist_cm numeric(6, 2) check (waist_cm >= 0),
  photo_url text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.progress
  alter column recorded_at type timestamptz using recorded_at::timestamptz,
  alter column recorded_at set default timezone('utc', now());

alter table public.progress drop constraint if exists progress_user_id_recorded_at_key;

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
before update on public.progress
for each row execute function public.set_updated_at();

create index if not exists idx_progress_user_id on public.progress (user_id);
create index if not exists idx_progress_recorded_at on public.progress (recorded_at desc);
create index if not exists idx_progress_user_recorded_at on public.progress (user_id, recorded_at desc);


create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  workout_date date not null default (timezone('utc', now())::date),
  recorded_at timestamptz not null default timezone('utc', now()),
  exercise_name text not null,
  set_number integer not null check (set_number > 0),
  reps integer not null check (reps > 0),
  weight_kg numeric(6, 2) not null check (weight_kg >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_workout_sets_user_id on public.workout_sets (user_id);
create index if not exists idx_workout_sets_recorded_at on public.workout_sets (recorded_at desc);
create index if not exists idx_workout_sets_user_date on public.workout_sets (user_id, workout_date desc);
create index if not exists idx_workout_sets_user_exercise on public.workout_sets (user_id, exercise_name);


create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists workout_plans_set_updated_at on public.workout_plans;
create trigger workout_plans_set_updated_at
before update on public.workout_plans
for each row execute function public.set_updated_at();

create index if not exists idx_workout_plans_user_id on public.workout_plans (user_id);


create table if not exists public.workout_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  source text,
  plan_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_workout_plan_versions_plan_id on public.workout_plan_versions (plan_id, created_at desc);
create index if not exists idx_workout_plan_versions_user_id on public.workout_plan_versions (user_id);


create table if not exists public.macro_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists macro_plans_set_updated_at on public.macro_plans;
create trigger macro_plans_set_updated_at
before update on public.macro_plans
for each row execute function public.set_updated_at();

create index if not exists idx_macro_plans_user_id on public.macro_plans (user_id);


create table if not exists public.macro_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.macro_plans (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  source text,
  plan_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_macro_plan_versions_plan_id on public.macro_plan_versions (plan_id, created_at desc);
create index if not exists idx_macro_plan_versions_user_id on public.macro_plan_versions (user_id);


create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists meal_plans_set_updated_at on public.meal_plans;
create trigger meal_plans_set_updated_at
before update on public.meal_plans
for each row execute function public.set_updated_at();

create index if not exists idx_meal_plans_user_id on public.meal_plans (user_id);


create table if not exists public.meal_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  source text,
  plan_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_meal_plan_versions_plan_id on public.meal_plan_versions (plan_id, created_at desc);
create index if not exists idx_meal_plan_versions_user_id on public.meal_plan_versions (user_id);


create table if not exists public.macro_plan_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  goal text check (goal in ('cut', 'maintain', 'bulk')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active')),
  tags text[] not null default '{}',
  plan_json jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists macro_plan_templates_set_updated_at on public.macro_plan_templates;
create trigger macro_plan_templates_set_updated_at
before update on public.macro_plan_templates
for each row execute function public.set_updated_at();

create index if not exists idx_macro_plan_templates_active on public.macro_plan_templates (is_active);
create index if not exists idx_macro_plan_templates_goal on public.macro_plan_templates (goal);


create table if not exists public.meal_plan_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  goal text check (goal in ('cut', 'maintain', 'bulk')),
  tags text[] not null default '{}',
  budget_vnd integer check (budget_vnd >= 0),
  plan_json jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists meal_plan_templates_set_updated_at on public.meal_plan_templates;
create trigger meal_plan_templates_set_updated_at
before update on public.meal_plan_templates
for each row execute function public.set_updated_at();

create index if not exists idx_meal_plan_templates_active on public.meal_plan_templates (is_active);
create index if not exists idx_meal_plan_templates_goal on public.meal_plan_templates (goal);


create table if not exists public.workout_plan_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  description text,
  goal text check (goal in ('cut', 'maintain', 'bulk')),
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  equipment text check (equipment in ('bodyweight', 'dumbbells', 'full_gym')),
  days_per_week integer check (days_per_week >= 2 and days_per_week <= 6),
  tags text[] not null default '{}',
  plan_json jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists workout_plan_templates_set_updated_at on public.workout_plan_templates;
create trigger workout_plan_templates_set_updated_at
before update on public.workout_plan_templates
for each row execute function public.set_updated_at();

create index if not exists idx_workout_plan_templates_active on public.workout_plan_templates (is_active);
create index if not exists idx_workout_plan_templates_goal on public.workout_plan_templates (goal);
create index if not exists idx_workout_plan_templates_equipment on public.workout_plan_templates (equipment);

