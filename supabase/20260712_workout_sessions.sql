-- 20260712_workout_sessions.sql
-- Add workout_sessions table to track start/finish of training sessions.
-- Also add session_id column to workout_sets so sets are linked to a session.

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_id uuid,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  duration_seconds integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.workout_sessions enable row level security;

drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
create policy "workout_sessions_select_own"
on public.workout_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
create policy "workout_sessions_insert_own"
on public.workout_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "workout_sessions_update_own" on public.workout_sessions;
create policy "workout_sessions_update_own"
on public.workout_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;
create policy "workout_sessions_delete_own"
on public.workout_sessions
for delete
using (auth.uid() = user_id);

alter table public.workout_sets add column if not exists session_id uuid null references public.workout_sessions(id) on delete set null;

create index if not exists idx_workout_sets_exercise_name on public.workout_sets (user_id, exercise_name);
create index if not exists idx_workout_sets_date on public.workout_sets (user_id, workout_date);

select pg_notify('pgrst', 'reload schema');
