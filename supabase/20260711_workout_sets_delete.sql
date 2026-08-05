-- 20260711_workout_sets_delete.sql
-- Add DELETE policy for workout_sets so users can remove their own logged sets.

drop policy if exists "workout_sets_delete_own" on public.workout_sets;
create policy "workout_sets_delete_own"
on public.workout_sets
for delete
using (auth.uid() = user_id);

select pg_notify('pgrst', 'reload schema');
