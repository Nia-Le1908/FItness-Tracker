-- 20260713_user_body_profile.sql
-- Extend users table with body composition fields for unified profile.
-- Settings is the single place to edit these; Macro/Meal/Workout read them as defaults.
-- Note: new columns must also be granted to authenticated role because
-- security_lockdown.sql (20260706) restricts column-level GRANTs on users.

alter table public.users add column if not exists weight_kg numeric(6,2);
alter table public.users add column if not exists body_fat_percent numeric(5,2);
alter table public.users add column if not exists activity_level text
  check (activity_level in ('sedentary', 'light', 'moderate', 'active'));

grant update (weight_kg, body_fat_percent, activity_level) on public.users to authenticated;
grant insert (weight_kg, body_fat_percent, activity_level) on public.users to authenticated;

select pg_notify('pgrst', 'reload schema');
