-- 20260720_user_goals_rls.sql
-- Enable RLS and add ownership policies for the user_goals table.
-- The table was created in schema.sql without RLS protection, leaving it
-- readable by any anon/authenticated client via PostgREST.

alter table public.user_goals enable row level security;

drop policy if exists "user_goals_select_own" on public.user_goals;
create policy "user_goals_select_own"
on public.user_goals
for select
using (auth.uid() = user_id);

drop policy if exists "user_goals_insert_own" on public.user_goals;
create policy "user_goals_insert_own"
on public.user_goals
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_goals_update_own" on public.user_goals;
create policy "user_goals_update_own"
on public.user_goals
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_goals_delete_own" on public.user_goals;
create policy "user_goals_delete_own"
on public.user_goals
for delete
using (auth.uid() = user_id);

select pg_notify('pgrst', 'reload schema');
