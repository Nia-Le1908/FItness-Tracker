-- FitBudget RLS policies (all tables)

alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

alter table public.progress enable row level security;

drop policy if exists "progress_select_own" on public.progress;
create policy "progress_select_own"
on public.progress
for select
using (auth.uid() = user_id);

drop policy if exists "progress_insert_own" on public.progress;
create policy "progress_insert_own"
on public.progress
for insert
with check (auth.uid() = user_id);

drop policy if exists "progress_update_own" on public.progress;
create policy "progress_update_own"
on public.progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.workout_sets enable row level security;

drop policy if exists "workout_sets_select_own" on public.workout_sets;
create policy "workout_sets_select_own"
on public.workout_sets
for select
using (auth.uid() = user_id);

drop policy if exists "workout_sets_insert_own" on public.workout_sets;
create policy "workout_sets_insert_own"
on public.workout_sets
for insert
with check (auth.uid() = user_id);

drop policy if exists "workout_sets_update_own" on public.workout_sets;
create policy "workout_sets_update_own"
on public.workout_sets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.workout_plans enable row level security;

drop policy if exists "workout_plans_select_own" on public.workout_plans;
create policy "workout_plans_select_own"
on public.workout_plans
for select
using (auth.uid() = user_id);

drop policy if exists "workout_plans_insert_own" on public.workout_plans;
create policy "workout_plans_insert_own"
on public.workout_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "workout_plans_update_own" on public.workout_plans;
create policy "workout_plans_update_own"
on public.workout_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.workout_plan_versions enable row level security;

drop policy if exists "workout_plan_versions_select_own" on public.workout_plan_versions;
create policy "workout_plan_versions_select_own"
on public.workout_plan_versions
for select
using (auth.uid() = user_id);

drop policy if exists "workout_plan_versions_insert_own" on public.workout_plan_versions;
create policy "workout_plan_versions_insert_own"
on public.workout_plan_versions
for insert
with check (auth.uid() = user_id);

alter table public.macro_plans enable row level security;

drop policy if exists "macro_plans_select_own" on public.macro_plans;
create policy "macro_plans_select_own"
on public.macro_plans
for select
using (auth.uid() = user_id);

drop policy if exists "macro_plans_insert_own" on public.macro_plans;
create policy "macro_plans_insert_own"
on public.macro_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "macro_plans_update_own" on public.macro_plans;
create policy "macro_plans_update_own"
on public.macro_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.macro_plan_versions enable row level security;

drop policy if exists "macro_plan_versions_select_own" on public.macro_plan_versions;
create policy "macro_plan_versions_select_own"
on public.macro_plan_versions
for select
using (auth.uid() = user_id);

drop policy if exists "macro_plan_versions_insert_own" on public.macro_plan_versions;
create policy "macro_plan_versions_insert_own"
on public.macro_plan_versions
for insert
with check (auth.uid() = user_id);

alter table public.meal_plans enable row level security;

drop policy if exists "meal_plans_select_own" on public.meal_plans;
create policy "meal_plans_select_own"
on public.meal_plans
for select
using (auth.uid() = user_id);

drop policy if exists "meal_plans_insert_own" on public.meal_plans;
create policy "meal_plans_insert_own"
on public.meal_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "meal_plans_update_own" on public.meal_plans;
create policy "meal_plans_update_own"
on public.meal_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.meal_plan_versions enable row level security;

drop policy if exists "meal_plan_versions_select_own" on public.meal_plan_versions;
create policy "meal_plan_versions_select_own"
on public.meal_plan_versions
for select
using (auth.uid() = user_id);

drop policy if exists "meal_plan_versions_insert_own" on public.meal_plan_versions;
create policy "meal_plan_versions_insert_own"
on public.meal_plan_versions
for insert
with check (auth.uid() = user_id);

alter table public.macro_plan_templates enable row level security;

drop policy if exists "macro_plan_templates_select_active" on public.macro_plan_templates;
create policy "macro_plan_templates_select_active"
on public.macro_plan_templates
for select
using (is_active = true);

alter table public.meal_plan_templates enable row level security;

drop policy if exists "meal_plan_templates_select_active" on public.meal_plan_templates;
create policy "meal_plan_templates_select_active"
on public.meal_plan_templates
for select
using (is_active = true);

alter table public.workout_plan_templates enable row level security;

drop policy if exists "workout_plan_templates_select_active" on public.workout_plan_templates;
create policy "workout_plan_templates_select_active"
on public.workout_plan_templates
for select
using (is_active = true);

select pg_notify('pgrst', 'reload schema');
